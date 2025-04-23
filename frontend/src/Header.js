import React from 'react';
import logo from './logo.png'
// import logo from '../ambergloglay.jpg';

const Header = () => {
  return (
    <header className="header">
      <img src={logo} alt="Logo" />
      <h1>Project Management Tool</h1>
    </header>
  );
};

export default Header;
