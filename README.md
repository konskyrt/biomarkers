# BIM Data Dashboard

> A full-stack web application for analyzing Building Information Modeling (BIM) data.

[![React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-green)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-blue)](https://www.docker.com/)

## 🔑 User Access

| Component | Platform | Access |
|-----------|----------|---------|
| Webpage | Docker | `http://localhost:5000` |
| Webpage | Render | `https://bim-data-dashboard.onrender.com` |

## 📑 Table of Contents

- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Deployment Guide](#-deployment-guide)
- [Usage](#-usage)
- [Troubleshooting](#-troubleshooting)

## 📁 Project Structure

```tree
construction-bim-data/
├── 📂 backend/
│   ├── 📜 app.py              # Flask application
│   ├── 📜 requirements.txt    # Python dependencies
│   └── 📂 helpers/            # Helper modules
├── 📂 frontend/
│   ├── 📜 package.json        # React configuration
│   ├── 📂 src/               # React source code
│   └── 📂 public/            # Public assets
├── 🐳 Dockerfile              # Multi-stage build
├── 📝 .dockerignore
└── 📖 README.md
```

## 🚀 Installation & Setup

### 🐳 Using Docker (Recommended)

1. **Clone Repository**
   ```bash
   git clone https://github.com/amberg-loglay/bim_data_dashboard.git
   cd bim_data_dashboard
   ```

2. **Build Docker Image**
   ```bash
   docker build -t construction-bim-data .
   ```

3. **Run Container**
   ```bash
   docker run -p 5000:5000 construction-bim-data
   ```

4. **Access Application**
   > 🌐 [http://localhost:5000](http://localhost:5000)

## 🔧 Troubleshooting

<details>
<summary>🐳 Docker Issues</summary>

```bash
# Clean build
docker build --no-cache -t construction-bim-data .
```
</details>

<details>
<summary>⚛️ React Issues</summary>

- Check `package.json` dependencies
- Verify module imports
</details>

<details>
<summary>🔍 404 Errors</summary>

- Verify static file configuration
- Check build paths
</details>

---
*Made with ❤️ by the BIM Data Team*
