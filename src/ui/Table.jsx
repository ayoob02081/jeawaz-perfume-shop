function Table({ children, className }) {
  return (
    <table className={`table-fixed ${className} size-full`}>{children}</table>
  );
}

export default Table;

function TableHeader({ children, className }) {
  return (
    <thead className="size-full">
      <tr className={`${className} size-full`}>{children}</tr>
    </thead>
  );
}

function TableBody({ children }) {
  return <tbody className="size-full">{children}</tbody>;
}

function TableRow({ children, className, border }) {
  return (
    <tr
      className={`${className} size-full ${
        border && "border-t border-stroke pt-6"
      }`}
    >
      {children}
    </tr>
  );
}

Table.Header = TableHeader;
Table.body = TableBody;
Table.Row = TableRow;
