import FooterDetail from "./FooterDetail";

function Footer() {
  return (
    <div className="flex flex-col items-start justify-btween gap-4 p-6 bg-pink-300 mb-20">
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
    </div>
  );
}

export default Footer;
