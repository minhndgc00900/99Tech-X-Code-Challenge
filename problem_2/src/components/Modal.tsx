import { AutoComplete, Modal } from "antd";
import React from "react";

const ModalComponent: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
}> = ({ open, setOpen }) => {
  const options = [
    { value: "Burns Bay Road" },
    { value: "Downing Street" },
    { value: "Wall Street" },
  ];
  return (
    <>
      <Modal
        title={<p className="text-2xl">Select a token</p>}
        open={open}
        onCancel={() => setOpen(false)}
        centered
        footer={null}
>
        <AutoComplete
          options={options}
          className="auto-complete"
          placeholder="Search"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
        />
      </Modal>
    </>
  );
};

export default ModalComponent;
