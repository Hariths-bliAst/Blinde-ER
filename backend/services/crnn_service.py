"""
Blind-ER — Stage 1: Custom CRNN Optical Character Recognition Service
Owner: Hariths (Project Lead & CRNN Model Trainer)

Integrates Hariths's custom-trained PyTorch CRNN model (`backend/models/crnn_book_scanner.pth`)
with CTC greedy decoding and automatic line/word strip preprocessing.
"""

import io
from pathlib import Path
from typing import Dict, Any, List, Tuple

import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image, ImageOps

from config.settings import settings

# =============================================================================
# 1. Hariths's Trained CRNN Configuration & Alphabet Mapping
# =============================================================================
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,'-!?()\":;"
CHAR2IDX = {char: idx + 1 for idx, char in enumerate(ALPHABET)}
IDX2CHAR = {idx + 1: char for idx, char in enumerate(ALPHABET)}
NUM_CLASSES = len(ALPHABET) + 1  # +1 for CTC blank token (index 0)
HIDDEN_SIZE = 256
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Fallback text used ONLY when USE_MOCK_CRNN=true in .env
MOCK_RAW_OCR_TEXT = (
    "CHAP- TER IV: THE SILENT LIGHTHOUSE -- p. 42\n"
    "The wind howled ac- ross the jagged cliffs of Northum- berland, car- rying "
    "with it the bitter scent of salt and approaching storm. Elara clutched her "
    "weath- ered lantern tighter. 'Someone left the bea- con burning,' she whis- "
    "pered into the dark- ness, her voice trembling yet reso- lute. Below her, "
    "the sea crashed like an ancient drum summoning the lost ships home."
)


# =============================================================================
# 2. Hariths's Exact PyTorch CRNN Architecture
# =============================================================================
class CRNN(nn.Module):
    def __init__(self, img_channel: int, num_class: int, hidden_size: int):
        super(CRNN, self).__init__()

        self.cnn = nn.Sequential(
            nn.Conv2d(img_channel, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d(2, 2),

            nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(True),

            nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d((2, 2), (2, 1), (0, 1)),

            nn.Conv2d(256, 512, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(True),

            nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1),
            nn.ReLU(True),
            nn.MaxPool2d((2, 2), (2, 1), (0, 1)),

            nn.Conv2d(512, 512, kernel_size=2, stride=1, padding=0),
            nn.BatchNorm2d(512),
            nn.ReLU(True),
        )

        self.rnn = nn.Sequential(
            nn.LSTM(
                512,
                hidden_size,
                bidirectional=True,
                num_layers=2,
                batch_first=True,
            )
        )

        self.fc = nn.Linear(hidden_size * 2, num_class)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        conv = self.cnn(x)
        batch, channel, h, w = conv.size()
        conv = conv.squeeze(2)
        conv = conv.permute(0, 2, 1)
        rnn_out, _ = self.rnn(conv)
        output = self.fc(rnn_out)
        return output


# =============================================================================
# 3. Singleton Model Loader & Preprocessing Transform
# =============================================================================
_loaded_crnn_model: CRNN | None = None

CRNN_TRANSFORM = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,)),
])


def get_crnn_model() -> CRNN:
    """Loads `crnn_book_scanner.pth` once into memory and caches the model."""
    global _loaded_crnn_model
    if _loaded_crnn_model is not None:
        return _loaded_crnn_model

    weights_path = Path(settings.CRNN_MODEL_WEIGHTS_PATH)
    if not weights_path.is_absolute():
        weights_path = Path(__file__).resolve().parent.parent / weights_path

    if not weights_path.exists():
        raise FileNotFoundError(
            f"CRNN weights file not found at: {weights_path}. "
            "Ensure `backend/models/crnn_book_scanner.pth` exists."
        )

    model = CRNN(img_channel=1, num_class=NUM_CLASSES, hidden_size=HIDDEN_SIZE)
    state_dict = torch.load(weights_path, map_location=DEVICE, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()

    _loaded_crnn_model = model
    return _loaded_crnn_model


def decode_ctc_greedy(logits: torch.Tensor) -> Tuple[List[str], float]:
    """
    Decodes CRNN output logits `[batch, seq_len, num_classes]` using CTC greedy
    decoding (collapsing repeated tokens and removing blank token `0`).
    """
    probs = logits.softmax(dim=2)
    max_probs, pred_indices = probs.max(dim=2)  # [batch, seq_len]

    decoded_strings: List[str] = []
    confidences: List[float] = []

    for b in range(pred_indices.size(0)):
        seq = pred_indices[b].tolist()
        prob_seq = max_probs[b].tolist()
        chars: List[str] = []
        char_probs: List[float] = []
        prev_idx = 0

        for idx, p in zip(seq, prob_seq):
            if idx != 0 and idx != prev_idx:
                char = IDX2CHAR.get(idx, "")
                if char:
                    chars.append(char)
                    char_probs.append(p)
            prev_idx = idx

        decoded_strings.append("".join(chars))
        if char_probs:
            confidences.append(sum(char_probs) / len(char_probs))
        else:
            confidences.append(float(max_probs[b].mean().item()))

    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    return decoded_strings, round(avg_conf, 4)


def _segment_image_into_strips(gray_img: Image.Image) -> List[Image.Image]:
    """
    Prepares either a single word/line crop OR a multi-line book page for the
    128x32 (or Wx32) CRNN input requirement.
    """
    width, height = gray_img.size

    # Auto-contrast helps normalize real mobile camera lighting onto white/black
    enhanced = ImageOps.autocontrast(gray_img, cutoff=2)

    # Case 1: Image is already a single-line strip or short crop
    if height <= 80 or (width / max(height, 1)) >= 2.2:
        target_w = max(128, int(round((width / max(height, 1)) * 32)))
        return [enhanced.resize((target_w, 32), Image.Resampling.BILINEAR)]

    # Case 2: Multi-line book page -> detect horizontal text rows via ink density
    # Resize page to standard working width for fast row segmentation
    work_w = 512
    work_h = max(64, int(round(height * (work_w / max(width, 1)))))
    page = enhanced.resize((work_w, work_h), Image.Resampling.BILINEAR)
    pixels = page.load()

    # Compute dark-pixel count per horizontal row
    row_ink = []
    for y in range(work_h):
        dark_count = sum(1 for x in range(work_w) if pixels[x, y] < 165)
        row_ink.append(dark_count)

    # Find contiguous line intervals
    min_ink = max(3, int(work_w * 0.015))
    line_bounds: List[Tuple[int, int]] = []
    in_line = False
    start_y = 0

    for y, ink in enumerate(row_ink):
        if ink >= min_ink and not in_line:
            in_line = True
            start_y = max(0, y - 3)
        elif ink < min_ink and in_line:
            in_line = False
            end_y = min(work_h, y + 3)
            if (end_y - start_y) >= 8:
                line_bounds.append((start_y, end_y))

    if in_line and (work_h - start_y) >= 8:
        line_bounds.append((start_y, work_h))

    if not line_bounds:
        return [enhanced.resize((128, 32), Image.Resampling.BILINEAR)]

    strips: List[Image.Image] = []
    for y1, y2 in line_bounds[:25]:  # Cap at 25 lines per page
        line_crop = page.crop((0, y1, work_w, y2))
        line_h = max(1, y2 - y1)
        # Scale line height to 32px while preserving aspect ratio (min 128px wide)
        scaled_w = max(128, int(round((work_w / line_h) * 32)))
        strips.append(line_crop.resize((scaled_w, 32), Image.Resampling.BILINEAR))

    return strips


def run_trained_crnn_inference(image_bytes: bytes) -> Tuple[str, float]:
    """
    Runs Hariths's trained CRNN model (`backend/models/crnn_book_scanner.pth`)
    on the uploaded image bytes and returns `(extracted_text, confidence)`.
    """
    model = get_crnn_model()
    gray_img = Image.open(io.BytesIO(image_bytes)).convert("L")
    strips = _segment_image_into_strips(gray_img)

    decoded_lines: List[str] = []
    line_confidences: List[float] = []

    with torch.no_grad():
        for strip in strips:
            tensor = CRNN_TRANSFORM(strip).unsqueeze(0).to(DEVICE)  # [1, 1, 32, W]
            logits = model(tensor)
            texts, conf = decode_ctc_greedy(logits)
            line_text = texts[0].strip()
            if line_text:
                decoded_lines.append(line_text)
                line_confidences.append(conf)

    full_text = "\n".join(decoded_lines).strip()
    avg_conf = (
        round(sum(line_confidences) / len(line_confidences), 4)
        if line_confidences
        else 0.0
    )
    return full_text, avg_conf


def extract_text_from_image(image_bytes: bytes, filename: str = "page.jpg") -> Dict[str, Any]:
    """
    Accepts raw image bytes from the mobile document camera and returns
    extracted raw text from Hariths's custom CRNN pipeline.
    """
    if settings.USE_MOCK_CRNN:
        return {
            "raw_text": MOCK_RAW_OCR_TEXT,
            "engine": "mock-crnn-v1",
            "filename": filename,
            "image_size_bytes": len(image_bytes),
            "confidence": 0.94,
        }

    extracted_text, confidence = run_trained_crnn_inference(image_bytes)
    return {
        "raw_text": extracted_text,
        "engine": f"custom-crnn-pytorch ({DEVICE.type})",
        "filename": filename,
        "image_size_bytes": len(image_bytes),
        "confidence": confidence,
    }
