"use client";

import Loading from "@/components/Loading";
import { useGetAllGenderCategories } from "@/hooks/useCategories";
// import { useUpdateProduct } from "@/hooks/useProducts";
import RHFTextField from "@/ui/RHFTextField";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";
import { TagsInput } from "react-tag-input-component";
import useAddProduct from "../products/useCreatePost";
import useEditProduct from "../products/useEditPost";

const productFormData = [
  {
    id: 1,
    label: "عنوان فارسی",
    name: "perTitle",
  },
  {
    id: 2,
    label: "عنوان انگلیسی",
    name: "enTitle",
  },
  {
    id: 3,
    label: "توضیحات",
    name: "description",
  },

  {
    id: 4,
    label: "برند",
    name: "brand",
  },
  {
    id: 5,
    label: "قیمت",
    name: "price",
  },
  {
    id: 6,
    label: "تخفیف",
    name: "offValue",
  },
  {
    id: 7,
    label: "موجودی",
    name: "stock",
  },
  {
    id: 8,
    label: "لینک عکس محصول",
    name: "imageLink",
  },
];

function ProductForm({ productToEdit }) {
  const queryClient = useQueryClient();
  const params = useParams();
  // console.log(productToEdit);
  //   const {
  //     id,
  //     category,
  //     accordCategories,
  //     enTitle,
  //     perTitle,
  //     description,
  //     brand,
  //     price,
  //     offValue,
  //     stock,
  //     imageUrl,
  //     firstNotes: preveFirstNotes,
  //     middleNotes: preveMiddleNotes,
  //     finalNotes: preveFinalNotes,
  //   } = productToEdit || "";

  const [formData, setFormData] = useState({
    enTitle,
    perTitle,
    description,
    // brand,
    price,
    offValue,
    stock,
    // imageUrl,
  });
  const { data, isLoading: isLoadingProducts } = useGetAllGenderCategories();

  //   const { editProduct, isEditing } = useEditProduct();
  const { isAdding, AddProduct } = useAddProduct();
  //   console.log(isLoadingProducts,data);

  const categories = data || {};
  const router = useRouter();
  const [firstNotes, setFirstNotes] = useState(
    // preveFirstNotes ||
    []
  );
  const [middleNotes, setMiddleNotes] = useState(
    // preveMiddleNotes ||
    []
  );
  const [finalNotes, setFinalNotes] = useState(
    // preveFinalNotes ||
    []
  );

  const [selectedGenderCategory, setSelectedGenderCategory] = useState([""]);
  const [selectedAccordsCategory, setSelectedAccordsCategory] = useState([""]);

  //   console.log(
  //     firstNotes,
  //     middleNotes,
  //     finalNotes,
  //     selectedGenderCategory
  //   );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  console.log(formData);

  const handleSubmitForm = async (e) => {
    try {
      //   if (productToEdit) {
      //     // e.preventDefault();
      //     const data = await mutateAsync({
      //       productId: id,
      //       data: {
      //         ...formData,
      //         firstNotes,
      //         middleNotes,
      //         finalNotes,
      //         category: selectedGenderCategory.id,
      //         accordCategories: selectedAccordsCategory,
      //       },
      //     });
      //     // toast.success(message);
      //     console.log(data);
      //   } else {
      //   setFormData(e);
      const data = await AddProduct({
        data: {
          ...formData,
          firstNotes,
          middleNotes,
          finalNotes,
          category: selectedGenderCategory,
          accordCategories: selectedAccordsCategory,
        },
      });
      console.log(data);
      console.log(errors);

      // toast.success(message);
      //   }
      queryClient.invalidateQueries(["queryClient"]);
      router.push("/admin/products");
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(handleChange)}>
      {productFormData.map((item) => {
        return (
          <RHFTextField
            key={item.id}
            register={register}
            isRequired
            label={item.label}
            name={item.name}
            className="textField__input textField__authInput w-full"
            validationSchema={{ required: true }}
            // placeholder="مثال: رضا"
          />
        );
      })}
      <div className="space-y-4">
        <label className="text-secondary-600 text-lg" htmlFor="category">
          دسته‌بندی محصولات
        </label>
        <Select
          classNames={{
            control: (state) =>
              state.isFocused
                ? "outline-none bg-white shadow-input-focus border-primary-300 "
                : "bg-gray-100 border-gray-100 outline-none ",
          }}
          instanceId="category"
          getOptionValue={(option) => option.id}
          getOptionLabel={(option) => option.name}
          onChange={setSelectedGenderCategory}
          options={categories}
          defaultValue={category}
        />
      </div>
      <div className="space-y-4">
        <label
          className="text-secondary-600 text-lg"
          htmlFor="accordCategories"
        >
          دسته‌بندی رایحه‌ها
        </label>
        <Select
          classNames={{
            control: (state) =>
              state.isFocused
                ? "outline-none bg-white shadow-input-focus border-primary-300 "
                : "bg-gray-100 border-gray-100 outline-none ",
          }}
          instanceId="accordCategories"
          getOptionValue={(option) => option.id}
          getOptionLabel={(option) => option.name}
          onChange={setSelectedAccordsCategory}
          options={allAccordCategories}
          defaultValue={accordCategories}
          isMulti
          isClearable
        />
      </div>
      <div className="space-y-4">
        <label className="text-secondary-600 text-lg mb-4" htmlFor="firstNotes">
          نت های آغازین
        </label>
        <TagsInput
          name="firstNotes"
          id="firstNotes"
          value={firstNotes}
          onChange={setFirstNotes}
          classNames={{ tag: "mt-1", input: "" }}
        />
      </div>
      <div className="space-y-4">
        <label
          className="text-secondary-600 text-lg mb-4"
          htmlFor="middleNotes"
        >
          نت های میانی
        </label>
        <TagsInput
          name="middleNotes"
          id="middleNotes"
          value={middleNotes}
          onChange={setMiddleNotes}
          classNames={{ tag: "mt-1", input: "" }}
        />
      </div>
      <div className="space-y-4">
        <label className="text-secondary-600 text-lg mb-4" htmlFor="finalNotes">
          نت های پایانی
        </label>
        <TagsInput
          name="finalNotes"
          id="finalNotes"
          value={finalNotes}
          onChange={setFinalNotes}
          classNames={{ tag: "mt-1", input: "" }}
        />
      </div>
      {
        //   isPending ? (
        //     <Loading />
        //   ) : (
        <button className="btn btn--primary">اضافه کردن محصول</button>
      }
    </form>
  );
}

export default ProductForm;
