import FooterDetail from "./FooterDetail";

function OptionsFooter() {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start justify-evenly gap-4 p-6 bg-pink-300 mb-20 sm:m-0">
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
    </div>
  );
}

export default OptionsFooter;
