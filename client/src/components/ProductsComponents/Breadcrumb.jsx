import React from 'react';
import './Breadcrumb.css';

export const Breadcrumb = ({ items }) => {
  const defaultItems = [
    { label: 'Home', href: '/' },
    { label: 'Café de especialidad', href: null }
  ];

  const breadcrumbItems = items || defaultItems;

  return (
    <div className="section-template-products">
      <div className="page-width">
        <div className="breadcrumb">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.href ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span>{item.label}</span>
              )}
              {index < breadcrumbItems.length - 1 && <span> &gt; </span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};