// const btnType = {
//   primary: "btn--primary",
//   secondary: "btn--secondary",
//   outline: "btn--outline",
//   danger: "btn--danger",
// };

function Button({
  children,
  onClick,
  className,
  type = "button",
  // variant = "primary",
  ...rest
}) {
  return (
    <button type={type} onClick={onClick} className={className} {...rest}>
      {children}
    </button>
  );
}

export default Button;
