import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react'
import { navLogo } from './constants';

const navbar = ({setRegisterVisible}) => {
    const [hasScrolledPast, setHasScrolledPast] = useState(false);
    const breakpoint = 10;
    const handleButtonClick = () => {
        // Trigger parent state change
        setRegisterVisible(true);
      };
    useEffect(() => {
        const handleScroll = () => {
          if (window.scrollY > breakpoint) {
            setHasScrolledPast(true);
          } else {
            setHasScrolledPast(false);
          }
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      }, []);

  return (
                <motion.nav className={"transition-all w-full flex flex-row justify-center items-center items-center h-24 fixed top-0 z-50"}
                style={{
                  backgroundColor: hasScrolledPast ? 'rgba(18, 18, 18, 1)' : 'transparent', 
                }}
                transition={{
                  backgroundColor: { duration: 0.5, ease: 'easeInOut' }, 
                }}
                >
                    <div className='flex flex-row items-center justify-between w-[1200px]'>
                <div className="flex flex-row items-center">
                    <img
                    src={navLogo}
                    alt="logo"
                    className="w-20 h-20 object-contain"
                    />

                </div>

                            <div className="text-black flex flex-row justify-center items-center gap-10 ">
                                <motion.button className='h-10 w-28 bg-[#ffffff] flex flex-row justify-center items-center rounded-full'
                                whileHover={{scale: 1.1}}
                                whileTap={{scale: 0.99}}
                                onClick={handleButtonClick}
                                >
                                <span className='font-bold'>REGISTER</span>
                                </motion.button>
   
                            </div>
                            </div>
                            </motion.nav>


  )
}

export default navbar