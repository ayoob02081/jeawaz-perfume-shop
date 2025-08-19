function GenderType() {
  return (
    <div className="flex items-center justify-between gap-1 pb-6">
      <button className="bg-whit border-2 border-secondary py-1 px-3 rounded-4xl text-black focus:text-primary focus:border-primary">
        <p className="">man</p>
      </button>
      <button className="bg-whit border-2 border-secondary py-1 px-3 rounded-4xl text-black focus:text-primary focus:border-primary">
        <p className="">woman</p>
      </button>
    </div>
  );
}

export default GenderType;
