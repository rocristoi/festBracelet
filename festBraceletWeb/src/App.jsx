import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './navbar';
import Scans from './scans';
import { festName } from './constants';

function App() {
  const [registerVisible, setRegisterVisible] = useState(false);
  const [readData, setReadData] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserTicketId, setNewUserTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState([]);
  const [readRequests, setReadRequests] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:5000/scans')
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched data:', data);
          setReadData(data);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    };
  
    if (readRequests) {
      fetchData();  
  
      const intervalId = setInterval(fetchData, 2000);
  

      return () => clearInterval(intervalId);
    } else {
      return () => {};
    }
  }, [readRequests]);  


  const handleClosePopup = () => {
    setRegisterVisible(false);
  };

  const handleDoneSubmit = () => {
    setSuccess([]); 
    setReadRequests(true)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newUserName || !newUserTicketId) {
      alert('Please fill in both name and ticket ID.');
      return;
    }

    setLoading(true); 
    setReadRequests(false) 

    const formattedInput = newUserName.replace(/\s+/g, '+');

    try {
      const response = await fetch(
        `http://localhost:5000/insert?name=${formattedInput}&ticketid=${newUserTicketId}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSuccess([true, result.result, newUserName, newUserTicketId]);
        setNewUserName('');
        setNewUserTicketId('');
        setRegisterVisible(false); 
      } else {
        console.error('Error: Failed to register the user.');
      }
    } catch (error) {
      console.error('Error during POST request: ', error);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="">
      <AnimatePresence>
        {success[0] && (
          <motion.div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center"
            initial={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            animate={{ backdropFilter: 'blur(10px)', opacity: 1 }}
            exit={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-[#262626] rounded-xl text-center w-96 max-w-lg shadow-lg h-[280px]"
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            >
              <div className="w-full h-3 flex justify-end">
                <a
                  className="p-4 cursor-pointer"
                  onClick={handleClosePopup}
                >
                  <span className="text-white font-black select-none">✕</span>
                </a>
              </div>
              <div className="p-8">
                <form onSubmit={handleDoneSubmit}>
                  <h2 className="text-xl font-semibold mb-4 text-white">
                    User successfully registered!
                  </h2>
                  <div className="flex flex-col items-center justify-center ">
                    <span>Name: {success[2]}</span>
                    <span>New ID: {success[1].slice(festName.length)}</span>
                    <span>Ticket ID: {success[3]}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-5 items-center">
                    <motion.button
                      type="submit"
                      className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 focus:outline-none"
                      whileHover={{ scale: 1.1 }}
                    >
                      Done
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {registerVisible && (
          <motion.div
            className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center"
            initial={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            animate={{ backdropFilter: 'blur(10px)', opacity: 1 }}
            exit={{ backdropFilter: 'blur(0px)', opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-[#262626] rounded-xl text-center w-96 max-w-lg shadow-lg h-[280px]"
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            >
              <div className="w-full h-3 flex justify-end">
                <a
                  className="p-4 cursor-pointer"
                  onClick={handleClosePopup}
                >
                  <span className="text-white font-black select-none">✕</span>
                </a>
              </div>
              <div className="p-8">
                <form onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-4 text-white">
                    Enter user's details
                  </h2>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                        id="name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="bg-[#404040] h-8 placeholder-gray text-[#919EF1] text-[12px] lg:text-sm  rounded-lg border-gray-200 focus:border-transparent focus:ring-0 outline-none block w-[180px] pl-2.5"
                        placeholder="Name (eg. John Doe)"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                        id="ticketid"
                        value={newUserTicketId}
                        onChange={(e) => setNewUserTicketId(e.target.value)}
                        className="bg-[#404040] h-8 placeholder-gray text-[#919EF1] text-[12px] lg:text-sm  rounded-lg border-gray-200 focus:border-transparent focus:ring-0 outline-none block w-[180px] pl-2.5"
                        placeholder="Ticket ID (eg. 123456)"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-5 items-center">
                    {loading ? (
                      <span>Please tap a tag onto the scanner...</span>
                    ) : (
                      <motion.button
                        type="submit"
                        className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                      >
                        Register
                      </motion.button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar setRegisterVisible={setRegisterVisible} />
      <div className="mt-20">
        {readData && <Scans readData={readData} />}
      </div>
    </div>
  );
}

export default App;
