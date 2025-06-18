import { SearchOutlined } from "@ant-design/icons";
import { Input, Modal } from "antd";
import React, { useState } from "react";
import type { Currency } from "../types/SwapToken";

interface ModalComponentProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  tokenLists: Currency[];
  onSelect: (token: Currency) => void;
}

const ModalComponent: React.FC<ModalComponentProps> = ({
  open,
  setOpen,
  tokenLists,
  onSelect,
}) => {
  const [value, setValue] = useState<string>("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow letters, numbers, and spaces for search
    const regex = /^[a-zA-Z0-9\s]*$/;
    if (regex.test(newValue) || newValue === '') {
      setValue(newValue);
    }
  };

  const filteredTokens = tokenLists.filter((token) =>
    token.currency.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <>
      <Modal
        className="modal-custom"
        title={
          <div className="">
            <p className="text-2xl">Select a token</p>
            <Input
              className="auto-complete !mt-4"
              placeholder="Search"
              prefix={<SearchOutlined />}
              value={value}
              onChange={handleSearchChange}
            />
          </div>
        }
        open={open}
        onCancel={() => {
          setValue("");
          setOpen(false);
        }}
        centered
        footer={null}
      >
        <div
          className="flex flex-col gap-4 overflow-y-auto mt-[1rem] pr-2"
          style={{ maxHeight: "calc(100vh - 300px)" }}
        >
          {filteredTokens.map((token) => (
            <div className="hover:bg-gray-800 rounded-lg mx-6">
              <div
                key={token.currency}
                className="flex items-center gap-4 cursor-pointer text-white p-2"
                onClick={() => {
                  onSelect(token);
                  setValue("");
                  setOpen(false);
                }}
              >
                <img
                  src={`/tokens/${token.currency}.svg`}
                  alt={token.currency}
                  className="w-[50px] h-[50px]"
                />
                <div className="flex flex-col">
                  <div className="text-2xl">{token.currency}</div>
                  <div>${token.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ModalComponent;
