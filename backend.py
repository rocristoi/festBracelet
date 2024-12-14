import json
import time
import threading
from stringparser import Parser
from flask import Flask, jsonify, request
from smartcard.System import readers
from smartcard.util import toHexString
from smartcard.Exceptions import CardRequestTimeoutException
from smartcard.util import toHexString
import random
import queue
import mysql.connector
from dotenv import load_dotenv
import os
from flask_cors import CORS



app = Flask(__name__)
CORS(app)

load_dotenv()
DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT')

mysql = mysql.connector.connect(
  host=DB_HOST,
  user=DB_USER,
  password=DB_PASS,
  database=DB_NAME,
  port=DB_PORT
)

cursor = mysql.cursor()

queryUserMapping = """
CREATE TABLE IF NOT EXISTS festival_users (
    name VARCHAR(128) DEFAULT NULL,
    asciiID VARCHAR(255) NOT NULL,
    date_registered TIMESTAMP DEFAULT NULL,
    ticketID VARCHAR(255) DEFAULT NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (asciiID)
);
"""

scanRead_event = threading.Event()
scanWrite_event = threading.Event()


LOAD_KEY_COMMAND = [ 0xFF, 0x82, 0x00, 0x00, 0x06, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]

AUTHENTICATE_COMMAND = [ 0xFF, 0x88,  0x00, 0x01, 0x60, 0x00]

READ_COMMAND = [0xFF, 0xB0, 0x00, 0x01, 0x10]  # Read 16 bytes from block 1

# Define Key A 
KEY_A = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]  # Default factory key

# BUZZER_COMMAND = [0xFF, 0x00, 0x40, 0x80, 0x03, 0x05, 0x03, 0x01, 0x03]

def updateUserBalance(id, balance):
    try:
        print(f"Attempting to update balance to {balance} for {id}")
        cursor.execute("UPDATE festival_users SET balance=%s WHERE asciiID=%s", (balance, id))
        mysql.commit()
        return True
    except Exception as e:
        print(f"Error updating balance: {e}")
        mysql.rollback()  # Rollback if something goes wrong
        return False

def get_user_balance(user_id):
    try:
        query = "SELECT balance FROM festival_users WHERE asciiID = %s"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()
        if result:
            return result[0]
        else:
            return None
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

def generate_random_ascii_hex():
    base_string = "festival"
    while True:
        random_digits = ''.join(str(random.randint(0, 9)) for _ in range(8))
        full_string = base_string + random_digits
        cursor.execute("SELECT * FROM festival_users WHERE asciiID=%s", (full_string,))
        dbResult = cursor.fetchone()
        if dbResult == None:
            break
    hex_list = [f"0x{ord(char):02X}" for char in full_string]
    return [hex_list, full_string]

# Path to the nfcScans.json file
NFC_SCANS_FILE = 'nfcScans.json'


# Function to write data to the JSON file
def write_to_json(data):
    try:
        # Read existing data
        with open(NFC_SCANS_FILE, 'r') as file:
            scans = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        scans = []

    # Add the new scan data to the list
    scans.append(data)

    # Write the updated data back to the file
    with open(NFC_SCANS_FILE, 'w') as file:
        json.dump(scans, file, indent=4)

def read_nfc_tag(reader):
    connection = reader.createConnection()
    try:
        uuid = get_tag_info(reader)
        connection.connect()
        loadresponse, sw1, sw2 = connection.transmit(LOAD_KEY_COMMAND)
        if sw1 == 0x90 and sw2 == 0x00:
            print("Key loaded successfully")
        else:
            print(f"Failed to load key. SW1: {sw1:02X}, SW2: {sw2:02X}")
            return None

        authresponse, authsw1, authsw2 = connection.transmit(AUTHENTICATE_COMMAND)
        if authsw1 == 0x90 and authsw2 == 0x00:
            print("Authentication successful!")
        else:
            print(f"Authentication failed! SW1: {authsw1:02X}, SW2: {authsw1:02X}")
            return None

        readresponse, readsw1, readsw2 = connection.transmit(READ_COMMAND)
        if readsw1 == 0x90 and readsw2 == 0x00:
            print("Reading successful!")
            if readresponse == [0x00, 0x00, 0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00]:
                return "null"
        else:
            print(f"Reading failed! SW1: {authsw1:02X}, SW2: {authsw1:02X}")
            return None
        
        ascii_string = ''.join(chr(byte) for byte in readresponse)
        cursor.execute("SELECT * FROM festival_users WHERE asciiID=%s", (ascii_string,))
        dbResult = cursor.fetchone()
        if dbResult:
            return [ascii_string, uuid, dbResult[0], dbResult[3], dbResult[4]]
        else:
            return [ascii_string, uuid, "err", "err"]
    except Exception as e:
        return None
    finally:
        try:
            connection.disconnect()
        except Exception as e:
            print(f"Error during disconnection: {e}")



def write_nfc_tag(reader):
    connection = reader.createConnection()
    try:
        connection.connect()
        loadresponse, sw1, sw2 = connection.transmit(LOAD_KEY_COMMAND)
        if sw1 == 0x90 and sw2 == 0x00:
            print("Key loaded successfully")
        else:
            print(f"Failed to load key. SW1: {sw1:02X}, SW2: {sw2:02X}")
            return None

        authresponse, authsw1, authsw2 = connection.transmit(AUTHENTICATE_COMMAND)
        if authsw1 == 0x90 and authsw2 == 0x00:
            print("Authentication successful!")
        else:
            print(f"Authentication failed! SW1: {authsw1:02X}, SW2: {authsw1:02X}")
            return None
        
        #buzzresponse, buzzsw1, buzzsw2 = connection.transmit(BUZZER_COMMAND)
        #if buzzsw1 == 0x90 and buzzsw2 == 0x00:
        #    print("Buzz set successfully!")
        #else:
        #    print(f"Buzzer failed! SW1: {authsw1:02X}, SW2: {authsw1:02X}")
        #    return None

        readresponse, readsw1, readsw2 = connection.transmit(READ_COMMAND)
        if readsw1 == 0x90 and readsw2 == 0x00:
            print("Reading successful!")
            if readresponse == [0x00, 0x00, 0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00,0x00, 0x00]:
                newData = generate_random_ascii_hex()
                try:
                    blockToWrite = [0xFF, 0xD6, 0x00, 0x01, 0x10] + [int(x, 16) for x in newData[0]]
                    writeResponse, writesw1, writesw2 = connection.transmit(blockToWrite)
                    if writesw1 == 0x90 and writesw2 == 0x00:
                        print("Write successful!")
                        return newData[1]
                    else:
                        print(f"Failed to write data. Status: {writesw1:02X} {writesw2:02X}")
                        return None
                finally:
                    connection.disconnect()
            else:
                print("Tag is not empty.")
                connection.disconnect()
                time.sleep(3)
                return None
        else:
            print(f"Reading failed! SW1: {authsw1:02X}, SW2: {authsw1:02X}")
            return None
            
    except Exception as e:
        return None
    finally:
        try:
            connection.disconnect()
        except Exception as e:
            print(f"Error during disconnection: {e}")


def get_tag_info(reader):
    try:
        connection = reader.createConnection()
        connection.connect()
        response, sw1, sw2 = connection.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
        if sw1 == 0x90 and sw2 == 0x00:
            print(f"Tag UID: {toHexString(response)}")
            return toHexString(response)
        else:
            print(f"Failed to retrieve UID. Status: {sw1:02X} {sw2:02X}")
            return None
    finally:
        connection.disconnect()

def scanWrite(queue):
    while True:
        scanWrite_event.wait()  
        try:
            global name
            global ticketid
            queue.put('n')
            print("Waiting for a tag to write..." + "\nName to write for: " + name + "\nWith ticket ID: " + ticketid)
            reader_list = readers()
            if not reader_list:
                print("No NFC readers found!")
                time.sleep(1)
                continue

            reader = reader_list[0]
            response = write_nfc_tag(reader)
            if response is not None:
                print("Wrote new data to card:\nIn ASCII being: " + response)
                queue.put(response)  
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                query = "INSERT INTO festival_users (name, asciiID, date_registered, ticketID, balance) VALUES (%s, %s, %s, %s, 0)"
                values = (name, response, timestamp, ticketid)
                try:
                    cursor.execute(query, values)
                    mysql.commit()
                except Exception as e:
                    print("Error in sending new data to db: " + str(e))
                print(cursor.rowcount, "record inserted into db.")
                scanWrite_event.clear()  
                scanRead_event.set()  

        except Exception as e:
            print(f"Error in scanWrite: {e}")
        time.sleep(1)

def scanRead():
    while True:
        scanRead_event.wait()  # Wait until this thread is allowed to run
        try:
            reader_list = readers()
            if not reader_list:
                print("No NFC readers found!")
                time.sleep(1)
                continue

            reader = reader_list[0]

            tag_data = read_nfc_tag(reader)
            if tag_data is None:
                print('Waiting for a tag to read...')
            elif "Failed" not in tag_data and "Unable" not in tag_data:
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')

                scan_entry = {
                    'timestamp': timestamp,
                    'id': tag_data[0],
                    "uid": tag_data[1],
                    "name": tag_data[2],
                    "ticketID": tag_data[3],
                    "balance": str(tag_data[4])
                }

                write_to_json(scan_entry)
                print(f"Tag detected: {tag_data[0]} at {timestamp}")

            else:
                print(f"Error while reading NFC tag: {tag_data}")

            time.sleep(1)
        except CardRequestTimeoutException:
            print("Timeout: No card detected, retrying...")
            time.sleep(1)


result_queue = queue.Queue()
name = ''
ticketid = ''

@app.route('/insert', methods=['POST'])
def enable_scan_write():
    try:
        global name
        global ticketid
        name = request.args['name']
        ticketid = request.args['ticketid']
        scanRead_event.clear()
        scanWrite_event.set()
        while True:
            result = result_queue.get()
            if result != 'n':
                break
        with result_queue.mutex:
            result_queue.queue.clear()
        return jsonify({"result": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scans', methods=['GET'])
def insert_new_tag():
    try:
        scanWrite_event.clear()
        scanRead_event.set()
        result_queue.put(1)
        result_queue.get()
        with open(NFC_SCANS_FILE, 'r') as file:
            scans = json.load(file)
        return jsonify(scans), 200
    except FileNotFoundError:
        return jsonify({"error": "No scans found"}), 404
    
@app.route('/bal', methods=['POST'])
def balanceUpdate():
    try:
        newBal = request.args['balance']
        userId = request.args['userId']
        try:
            updateUserBalance(userId, newBal)
        except Exception as e:
            print("Error in updating user balance")
            return jsonify({"error": str(e)}), 500
        return "success",200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getbal', methods=['POST'])
def getBalance():
    try:
        userId = request.args['userId']
        try:
            balance = get_user_balance(userId)
        except Exception as e:
            print("Error in checking user balance")
            return jsonify({"error": str(e)}), 500
        return jsonify({"bal": balance}),200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    thread1 = threading.Thread(target=scanRead, daemon=True)
    thread2 = threading.Thread(target=scanWrite, daemon=True, args=(result_queue,))

    # Initially, thread 1 is running
    scanRead_event.set()  # Allow thread 1 to run
    scanWrite_event.clear()  # Prevent thread 2 from running

    thread1.start()
    thread2.start()
    try:
        cursor.execute(queryUserMapping)
        print("Successfully created the necessary tables.")
    except Exception as e:
        print("Failed to connect to DB. Error: " + e)

    # Start the Flask application
    app.run(host='0.0.0.0', port=5000)
