# Signature-Checker
CThis project is a deep learning-powered signature verification system that classifies signatures as genuine or forged with high accuracy. It uses a fine-tuned Swin Transformer model (swin_tiny_patch4_window7_224) trained with PyTorch.

The system includes:

Backend: Flask (Python) — to handle API requests and model inference.

Model: Swin Transformer pre-trained model fine-tuned for binary classification.

Frontend: Next.js — for a clean, responsive web interface to upload and verify signatures.

Preprocessing: OpenCV and Pillow for image enhancement.

Evaluation: NumPy and scikit-learn for accuracy, confusion matrix, and confidence score calculation.

Key Features:

Real-time signature verification

Transparent metrics (accuracy, confusion matrix, confidence score)

Scalable and production-ready backend

Simple and user-friendly web interface

Ideal for digital contracts, banking, HR, and identity verification
