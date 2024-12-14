# ![alt text](https://i.imgur.com/f3BsNNx.png)

**festBracelet** is an innovative project that reverse-engineers the functionality of NFC bracelets used in festivals and events. It creates a secure, scalable system for managing NFC-based user data and payments using MIFARE 1K-enabled NFC bracelets. 

The system uses a combination of:
- **Web Server** for managing front-end interactions.
- **Python Backends** for handling NFC checkpoint operations.

Even though the system has multiple components, it's resource-efficient and can run on **Raspberry Pi 3** devices. Each checkpoint works independently with an NFC sensor, allowing for secure and scalable communication with a centralized database.

---

## Features 🚀

- **Real-time User Data Insights**  
  View detailed information about users when their NFC bracelet is scanned.

- **Modify User Balance**  
  Add or subtract balance from a user's account with a simple and intuitive interface.

- **Register New Users**  
  Link a user's name and ticket ID to their NFC bracelet, setting the stage for future developments such as mobile top-ups.

---

## System Overview 📡

For each checkpoint, you need:
1. A **Raspberry Pi 3** (or better).
2. An **NFC ACS ACR122 sensor**.
3. Internet connection for syncing with the centralized database.

---

## Installation & Setup 🔧

### Step 1: Clone the Repository  
```bash
git clone https://github.com/rocristoi/festBracelet.git
cd festBracelet
```

### Step 2: Prepare the Backend
1. Install Python Requirements
     -  Ensure Python 3 is installed on your system, then run:

        ```bash
        pip install -r requirements.txt
        ```
2. Create the .env File
     -  In the `festBracelet` root directory, create a `.env` file with the following format:

        ```env
        DB_HOST=xxx
        DB_PORT=xxx
        DB_USER=xxx
        DB_PASS=xxx
        DB_NAME=xxx
        ```
3. Run the Backend Server
     -  Start the backend server by executing:
        ```bash
        python backend.py
        ```
### Step 3: Prepare the Front-End
1. Navigate to the Front-End Directory
        ```bash
        cd festBraceletWeb
        ```
2. Install Dependencies
        ```bash
        npm install
        ```
3. Edit the `constants.js` File

4. Build the Website
     - Build the static assets by running:
        ```bash
        npm run build
        ```
5. Host the Static Files
- Use Apache2 or Nginx to serve the files from the dist/ directory.

## How to Run a Checkpoint 🛠️
1. Connect Your NFC Sensor
- Attach the ACS122 NFC Sensor to your Raspberry Pi / Hosting Device
2. Start the Backend Server
- In the `festBracelet` root directory, run:
    ```bash
     python backend.py
    ```
3. Host the Front-End
- Serve the static files from dist/ using Apache2 or Nginx.


Once everything is set up, your checkpoint is ready to scan bracelets, modify user balances, and register new users.


## To-Do List 📝
- Create a user interface for solo top-ups via mobile phones.
- Ignore empty tags during NFC readings.
- Implement additional error-handling features for robustness.


## Contribute to festBracelet 🌟
Feel free to fork the repository, submit issues, and contribute to the project on GitHub :D


Developed with ❤️ by @rocristoi. Contributions are welcome!






