# BIM Data Dashboard

## **Overview**
The **BIM Data Dashboard** is a web-based application that visualizes and manages Building Information Modeling (BIM) data. It consists of a **backend** (Python-based) and a **frontend** (React-based), and it is fully containerized using Docker for easy deployment and setup.

---

## **Getting Started**
### **1. Prerequisites**
Ensure you have the following installed on your system:
- [Docker](https://www.docker.com/products/docker-desktop) (Recommended: Docker Desktop)
- Git (for cloning the repository)

---

### **2. Clone the Repository**
```bash
 git clone https://github.com/YOUR_COMPANY/bim_data_dashboard.git
 cd bim_data_dashboard
```

---

### **3. Run the Application with Docker**
Use Docker Compose to start the entire application (both backend and frontend):
```bash
docker-compose up --build
```

This will:
✅ Build the **backend** and **frontend** containers
✅ Start the **BIM data processing API** and the **web dashboard**

Once running, you can access the dashboard at:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

To stop the application:
```bash
docker-compose down
```

---

### **4. Running Without Docker (Optional for Development)**
If you prefer to run the application without Docker:
#### **Backend (Python Flask)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
#### **Frontend (React.js)**
```bash
cd frontend
npm install
npm start
```

---

## **Project Structure**
```
├── backend/       # Python-based API (Flask/Django)
│   ├── app.py     # Main backend application file
│   ├── Dockerfile # Docker configuration for backend
│   ├── requirements.txt # Dependencies
│   └── ...
│
├── frontend/      # React.js frontend application
│   ├── src/       # Frontend source code
│   ├── Dockerfile # Docker configuration for frontend
│   ├── package.json # Frontend dependencies
│   └── ...
│
├── docker-compose.yml  # Docker Compose file to run both services
├── README.md       # Project documentation (this file)
└── .gitignore      # Git ignored files
```

---

## **Troubleshooting**
### **Docker Issues**
1. **Docker Not Running?**
   - Ensure Docker is installed and running: 
     ```bash
     docker info
     ```
2. **Port Already in Use?**
   - Stop any service running on ports `3000` or `5000`:
     ```bash
     kill -9 $(lsof -t -i:3000 -i:5000)
     ```
3. **Docker Build Failing?**
   - Try clearing cached images:
     ```bash
     docker system prune -a
     ```

---


