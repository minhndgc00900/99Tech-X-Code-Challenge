import { ArrowDownOutlined, DownOutlined } from "@ant-design/icons";
import "./App.css";
import { Button, Input } from "antd";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useState } from "react";
import ModalComponent from "./components/Modal";

type Inputs = {
  sell: string;
  buy: string;
};

function App() {
  const { handleSubmit, control } = useForm<Inputs>({
    defaultValues: {
      sell: "",
      buy: "",
    },
  });
  const [open, setOpen] = useState<boolean>(false);


  const [active, setActive] = useState<number>(0);

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  return (
    <div className="container">
      <div className="w-screen min-h-full max-w-[1200px] flex flex-col items-center flex-1 relative m-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2 relative max-w-[480px] mx-auto py-16 w-full min-h-[31rem]"
        >
          <div className={`input-container ${active === 1 ? "!bg-black" : ""}`} onClick={() => setActive(1)}>
            <div className="flex">
              <div className="text-xl px-6 text-[16px] !text-[#ffffffa6]">
                Sell
              </div>
            </div>
            <div className="flex items-center justify-center h-auto" onClick={() => setActive(2)}>
              <Controller
                control={control}
                name="sell"
                render={({ field }) => (
                  <Input
                    placeholder="0"
                    className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                    {...field}
                  />
                )}
              />
              <div className="pr-[30px]">
                <Button onClick={() => setOpen(true)} className="" icon={<DownOutlined />} iconPosition="end">ETH</Button>
              </div>
            </div>
            <div className="flex">
              <div className="text-xl px-6 text-[14px] !text-[#ffffffa6]">
                0$
              </div>
            </div>
          </div>
          <div className={`input-container ${active === 2 ? "!bg-black" : ""}`} onClick={() => setActive(2)}>
            <div className="flex">
              <div className="text-xl px-6 text-[16px] !text-[#ffffffa6]">
                Buy
              </div>
            </div>
            <div className="flex items-center justify-center h-auto">
              <Controller
                control={control}
                name="buy"
                render={({ field }) => (
                  <Input
                    placeholder="0"
                    className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                    {...field}
                  />
                )}
              />
              <div className="pr-[30px]">
                <Button onClick={() => setOpen(true)} icon={<DownOutlined />} iconPosition="end">USDT</Button>
              </div>
            </div>
            <div className="flex">
              <div className="text-xl px-6 text-[14px] !text-[#ffffffa6]">
                0$
              </div>
            </div>
          </div>
          <Button className="swap-btn" icon={<ArrowDownOutlined />} />
          <Button className="submit-btn">Swap</Button>
        </form>
      </div>
      <ModalComponent open={open} setOpen={setOpen} />
    </div>
  );
}

export default App;
