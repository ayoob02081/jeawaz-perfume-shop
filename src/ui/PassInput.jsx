import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function PassInput({ onChange }) {
  const [passwordVisible, setPasswordVisible] = useState("password");
  const ShowPasswordHandler = () => {
    setPasswordVisible((prev) => (prev === "password" ? "text" : "password"));
  };
  return (
    <div
      className={`flex items-center justify-center gap-2 size-full px-5 py-1.5 rounded-[40px] ${className} text-text-secondary focus-within:*:text-text-primary  focus-within:bg-white focus-within:border border-primary`}
    >
      <input
        className="outline-0 size-full"
        dir="rtl"
        type={passwordVisible}
        id="password"
        pattern="[0-9]{4}-[0-9]{3}-[0-9]{4}"
        minLength={6}
        placeholder="وارد کردن رمز عبور"
        onChange={onChange}
      />
      <button onClick={ShowPasswordHandler}>
        {passwordVisible === "password" ? (
          <EyeSlashIcon className=" size-5" />
        ) : (
          <EyeIcon className=" size-5" />
        )}
      </button>
    </div>
  );
}

export default PassInput;
