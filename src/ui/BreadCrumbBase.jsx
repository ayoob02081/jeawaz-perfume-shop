function BreadCrumbBase({ children }) {
  return (
    <div className="w-full flex items-center justify-start gap-2">
      {children}
    </div>
  );
}

export default BreadCrumbBase;
