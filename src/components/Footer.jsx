import FooterDetail from "./FooterDetail";

function Footer() {
  return (
    <div className="flex flex-col items-center justify-btween gap-4 h-[25rem] p-4 bg-pink-300 mb-20">
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
      <FooterDetail />
    </div>
  );
}

export default Footer;
