import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { checkpointName, festName } from './constants';

const Scans = ({ readData }) => {
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [userData, setUserData] = useState();
  const [newBalance, setNewBalance] = useState();
  const [currentBalance, setCurrentBalance] = useState(null); 

  const handleIdClick = (userData) => {
    setTopUpVisible(true);
    setUserData(userData);
  };

  const handleClosePopup = () => {
    setTopUpVisible(false);
    setUserData(null);
    setNewBalance(null);
    setCurrentBalance(null); 
  };

  const handleTopUpSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/bal?userId=${userData.id}&balance=${newBalance}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        setTopUpVisible(false);
        setUserData(null);
        setNewBalance(null);
        setCurrentBalance(newBalance); 
      } else {
        console.error('Error: Failed to change balance of the user.');
      }
    } catch (error) {
      console.error('Error during POST request: ', error);
    }
  };

  useEffect(() => {
    if (userData && userData.id) {
      const fetchBalance = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/getbal?userId=${userData.id}`,
            {
              method: 'POST',
            }
          );

          if (response.ok) {
            const balance = await response.json();
            setCurrentBalance(balance.bal); 
          } else {
            console.error('Error: Failed to check balance of the user.');
          }
        } catch (error) {
          console.error('Error during GET request: ', error);
        }
      };
      fetchBalance();
    }
  }, [userData]); 

  return (
    <div>
      <AnimatePresence>
        {topUpVisible && (
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
                <form onSubmit={handleTopUpSubmit}>
                  <span className="text-red-500 text-xl font-semibold">{userData.name}</span>
                  <h2 className="text-sm">
                    Current balance: &nbsp;
                    <span className="text-red-500">
                      {currentBalance !== null ? currentBalance : 'Loading...'}
                    </span>
                  </h2>
                  <div className="flex items-center justify-center">
                    <input
                      type="text"
                      id="name"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="bg-[#404040] mt-6 h-8 placeholder-gray text-[#919EF1] text-[12px] lg:text-sm  rounded-lg border-gray-200 focus:border-transparent focus:ring-0 outline-none block w-[200px] pl-2.5"
                      placeholder="New balance (eg. 12.99)"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-5 items-center">
                    <motion.button
                      type="submit"
                      className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-200 focus:outline-none"
                      whileHover={{ scale: 1.1 }}
                    >
                      Set
                    </motion.button>
                    {newBalance && !isNaN(newBalance) && (
                      <span
                        style={{
                          color:
                            newBalance - currentBalance > 0
                              ? '#00FF00'
                              : '#FF0000',
                        }}
                      >
                        This will{' '}
                        {newBalance - currentBalance > 0
                          ? `add ${newBalance - currentBalance} to`
                          : `subtract ${-(newBalance - currentBalance)} from`}{' '}
                        user's credits
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-10 w-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <h2 className="font-black text-4xl">{checkpointName}</h2>
          <h2>Top-up & modify user balance</h2>
          {readData && readData.length > 0 && (
            <span className="text-sm">
              Since {new Date(readData[0].timestamp).toLocaleString()}, we have
              registered {readData.length} scans on this sensor
            </span>
          )}
        </div>
      </div>
      <div className="mt-20 flex flex-row flex-wrap gap-10 items-center justify-start ml-60">
        {readData &&
          readData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort in descending order by timestamp
            .map((read) => (
              <motion.div
                className="h-[250px] w-80 bg-[#282828] rounded-xl flex justify-center"
                key={read.timestamp}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="mt-5 flex flex-col items-center">
                  <span
                    className="font-medium text-center text-[20px] text-red-500 cursor-pointer"
                    onClick={() => handleIdClick(read)}
                  >
                    ID: {read.id.slice(festName.length)}
                  </span>
                  <span className="font-medium text-center mt-4">Name: {read.name}</span>
                  <span className="font-medium text-center">Tag UID: {read.uid}</span>
                  <span className="font-medium text-center">Ticket ID: {read.ticketID}</span>
                  <span className="font-bold text-center text-red-500">Balance: {read.balance}</span>

                  <motion.span
                    className="text-sm text-center cursor-pointer mt-6"
                    onClick={() => {
                      navigator.clipboard.writeText(read.id);
                    }}
                    whileHover={{ scale: 1.02, color: 'rgb(255 0 0)' }}
                  >
                    Copy ID
                  </motion.span>

                  <span className=" text-center text-sm text-gray-400">
                    {new Date(read.timestamp).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
      </div>
      <div className="flex flex-col items-center leading-tight mt-20">
        <h2>
          Developed by <span className="text-red-500">@rocristoi</span>
        </h2>
        <a href="https://github.com/rocristoi/festBracelet">
          <h2 className="text-blue-500">Contribute to this project on Github</h2>
        </a>
      </div>
    </div>
  );
};

export default Scans;
