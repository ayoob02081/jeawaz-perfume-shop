function NotExisted({ children, className }) {
  return (
    <div
      className={`container flex items-center justify-center font-bold text-primary-900 ${className}`}
    >
      {children}
    </div>
  );
}

export default NotExisted;
