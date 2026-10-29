"""
Blind-ER — Custom CRNN Training Pipeline (Dynamic Book Typography Dataset)
Author: Hariths (Project Lead)

Trains the 7-Layer CNN + 2-Layer Bidirectional LSTM CRNN architecture using
CTC Loss (`nn.CTCLoss`) over 40 epochs with Cosine Annealing learning rate
scheduling and synthetic Gaussian focus blur augmentation.
Saves trained weights to `backend/models/crnn_book_scanner.pth`.
"""

import os
import random
import shutil
import urllib.request
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from services.crnn_service import ALPHABET, CHAR2IDX, NUM_CLASSES, CRNN, DEVICE


def setup_fonts_and_vocab():
    os.makedirs("fonts", exist_ok=True)
    colab_default_font = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    font_path = "fonts/FreeSerif.ttf"

    if not os.path.exists(font_path):
        if os.path.exists(colab_default_font):
            shutil.copy(colab_default_font, font_path)
        else:
            font_path = "arial.ttf"

    word_list_path = "words.txt"
    if not os.path.exists(word_list_path):
        urllib.request.urlretrieve(
            "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt",
            word_list_path,
        )

    with open(word_list_path, "r", encoding="utf-8") as f:
        vocab = [
            word.strip().capitalize() if random.random() > 0.5 else word.strip()
            for word in f.readlines()
            if len(word.strip()) > 1
        ]
    return font_path, vocab


class DynamicBookDataset(Dataset):
    """Dynamic RAM-based generator simulating physical book text strips (128x32)."""

    def __init__(self, font_path: str, vocab: list[str], num_samples: int = 5000):
        self.num_samples = num_samples
        self.vocab = vocab
        try:
            self.font = ImageFont.truetype(font_path, 22)
        except IOError:
            self.font = ImageFont.load_default()

        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.5,), (0.5,)),
        ])

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        text = " ".join(random.choices(self.vocab, k=random.randint(1, 2)))
        if random.random() > 0.7:
            text += random.choice([".", ",", "?", "!"])
        text = text[:15]

        img = Image.new("L", (128, 32), color=255)
        draw = ImageDraw.Draw(img)

        bbox = draw.textbbox((0, 0), text, font=self.font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = max(0, (128 - text_w) / 2)
        y = max(0, (32 - text_h) / 2 - 2)

        draw.text((x, y), text, font=self.font, fill=0)

        if random.random() > 0.5:
            img = img.filter(
                ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.2))
            )

        encoded_text = [CHAR2IDX[c] for c in text if c in CHAR2IDX]
        return self.transform(img), torch.tensor(encoded_text, dtype=torch.long)


def ctc_collate_fn(batch):
    images, texts = zip(*batch)
    images = torch.stack(images, 0)
    target_lengths = torch.tensor([len(t) for t in texts], dtype=torch.long)
    targets = torch.cat(texts)
    return images, targets, target_lengths


def train_crnn(num_epochs: int = 40):
    font_path, vocab = setup_fonts_and_vocab()
    train_dataset = DynamicBookDataset(font_path, vocab, num_samples=10000)
    val_dataset = DynamicBookDataset(font_path, vocab, num_samples=2000)

    train_loader = DataLoader(
        train_dataset, batch_size=128, shuffle=True, collate_fn=ctc_collate_fn
    )
    val_loader = DataLoader(
        val_dataset, batch_size=128, shuffle=False, collate_fn=ctc_collate_fn
    )

    model = CRNN(img_channel=1, num_class=NUM_CLASSES, hidden_size=256).to(DEVICE)
    criterion = nn.CTCLoss(blank=0, reduction="mean", zero_infinity=True)
    optimizer = optim.Adam(model.parameters(), lr=0.0006, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=num_epochs, eta_min=0.000003
    )

    for epoch in range(num_epochs):
        model.train()
        epoch_train_loss = 0.0
        for images, targets, target_lengths in train_loader:
            images = images.to(DEVICE)
            targets = targets.to(DEVICE)
            target_lengths = target_lengths.to(DEVICE)

            optimizer.zero_grad()
            preds = model(images).permute(1, 0, 2)
            input_lengths = torch.full(
                size=(images.size(0),), fill_value=preds.size(0), dtype=torch.long
            ).to(DEVICE)

            loss = criterion(preds.log_softmax(2), targets, input_lengths, target_lengths)
            loss.backward()
            optimizer.step()
            epoch_train_loss += loss.item()

        avg_train_loss = epoch_train_loss / len(train_loader)

        model.eval()
        epoch_val_loss = 0.0
        with torch.no_grad():
            for val_images, val_targets, val_target_lengths in val_loader:
                val_images = val_images.to(DEVICE)
                val_targets = val_targets.to(DEVICE)
                val_target_lengths = val_target_lengths.to(DEVICE)

                val_preds = model(val_images).permute(1, 0, 2)
                val_input_lengths = torch.full(
                    size=(val_images.size(0),),
                    fill_value=val_preds.size(0),
                    dtype=torch.long,
                ).to(DEVICE)

                val_loss = criterion(
                    val_preds.log_softmax(2),
                    val_targets,
                    val_input_lengths,
                    val_target_lengths,
                )
                epoch_val_loss += val_loss.item()

        avg_val_loss = epoch_val_loss / len(val_loader)
        scheduler.step()
        print(
            f"Epoch [{epoch + 1}/{num_epochs}] | "
            f"Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}"
        )

    out_dir = Path(__file__).resolve().parent / "models"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "crnn_book_scanner.pth"
    torch.save(model.state_dict(), out_path)
    print(f"Saved trained CRNN weights to {out_path}")


if __name__ == "__main__":
    train_crnn()

