import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Header({ onHome, children, status }) {
  return <header className="site-header"><div className="site-header-inner">
    <div className="site-identity"><a className="site-brand" href="#overview" onClick={onHome}>SecondLook</a>{status}</div>
    {children || <a className="site-home" href="#overview" onClick={onHome}><ArrowLeft size={16} aria-hidden="true" />Back Home</a>}
  </div></header>;
}
