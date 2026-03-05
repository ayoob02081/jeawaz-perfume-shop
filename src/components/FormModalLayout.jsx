import AppImage from "./AppImage";

function FormModalLayout({ children, handleSubmit, onClose, closeBtn = true }) {
  return (
    <form
      className="flex flex-col items-center justify-between gap-4 size-full"
      onSubmit={handleSubmit()}
    >
      {closeBtn && (
        <button
          className="absolute md:left-6 max-md:top-3 md:top-6 btn max-md:border-0 max-md:h-1.5 max-md:w-10 max-md:rounded-4xl max-md:bg-stroke md:border-[1.5px] border-stroke md:size-10 rounded-full md:p-0"
          onClick={onClose}
          type="button"
        >
          <AppImage
            src="/images/close-simple-icon.svg"
            alt="close-icon"
            className="max-md:hidden"
            width="size-3.5"
            sizes="10vw"
          />
        </button>
      )}
      {children}
    </form>
  );
}

export default FormModalLayout;
