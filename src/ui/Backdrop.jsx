function Backdrop({ children, toggleOpen, className, openForm, closeForm }) {
  return (
    <div
      className={`${toggleOpen ? `${openForm}` : `${closeForm} `} 
    absolute z-50 max-md:duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export default Backdrop;
