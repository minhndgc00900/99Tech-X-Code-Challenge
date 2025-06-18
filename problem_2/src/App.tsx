import { ArrowDownOutlined, DownOutlined } from "@ant-design/icons";
import { Button, Input, notification } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import "./App.css";
import ModalComponent from "./components/Modal";
import { CURRENCY, MOCK_WALLET } from "./data";
import type { Currency } from "./types/SwapToken";


type Inputs = {
  sell: string;
  buy: string;
  fromToken: Currency;
  toToken: Currency;
};

function App() {
  const { handleSubmit, control, setValue, watch } = useForm<Inputs>({
    defaultValues: {
      sell: "",
      buy: "",
      fromToken: CURRENCY[4],
      toToken: CURRENCY[1],
    },
  });
  const [open, setOpen] = useState<boolean>(false);
  const [active, setActive] = useState<number>(0);
  const [tokenLists, setTokenLists] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const fromToken = watch("fromToken");
  const toToken = watch("toToken");
  const sellValue = watch("sell");
  const buyValue = watch("buy");

  useEffect(() => {
    initTokenInfo();
  }, []);

  const initTokenInfo = async () => {
    try {
      const tokenInfoResponse = CURRENCY;
      if (tokenInfoResponse) {
        setTokenLists(tokenInfoResponse);
      }
    } catch (error) {
      console.error("Failed to fetch token info", error);
    }
  };

  const handleChangeToken = (
    newValue: Currency,
    currentValue: Currency,
    setCurrentValue: (value: Currency) => void,
    otherValue: Currency,
    setOtherValue: (value: Currency) => void
  ) => {
    if (newValue.currency === otherValue.currency) {
      // Swap tokens
      setOtherValue(currentValue);
      setCurrentValue(newValue);
      // Swap values
      const currentSellValue = watch("sell");
      const currentBuyValue = watch("buy");
      setValue("sell", currentBuyValue);
      setValue("buy", currentSellValue);
    } else {
      setCurrentValue(newValue);
      // Recalculate values based on new token
      const currentValue = watch("sell");
      if (currentValue) {
        setValue("buy", convertValue(currentValue, newValue, otherValue));
      }
    }
  };

  const convertValue = useCallback(
    (value: string, from: Currency, to: Currency) => {
      if (!value || !from || !to) {
        return "0";
      }
      const convertedValue = (parseFloat(value) * from.price) / to.price;
      return isNaN(convertedValue) ? "0" : convertedValue.toFixed(8);
    },
    []
  );

  const exchangeBalance = useMemo(() => {
    if (!sellValue || !fromToken || !toToken) {
      return "0";
    }
    return convertValue(sellValue, fromToken, toToken);
  }, [sellValue, fromToken, toToken, convertValue]);

  const reverseExchangeBalance = useMemo(() => {
    if (!buyValue || !toToken || !fromToken) {
      return "0";
    }
    return convertValue(buyValue, toToken, fromToken);
  }, [buyValue, toToken, fromToken, convertValue]);

  const handleSellChange = (value: string) => {
    // Only allow numbers and one dot
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setValue("sell", value);
      setValue("buy", convertValue(value, fromToken!, toToken!));
    }
  };

  const handleBuyChange = (value: string) => {
    // Only allow numbers and one dot
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value) || value === "") {
      setValue("buy", value);
      setValue("sell", convertValue(value, toToken!, fromToken!));
    }
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (!data.sell || !fromToken || !toToken) {
      return;
    }

    // Check if user has enough balance
    const sellAmount = parseFloat(data.sell);
    const walletBalance = MOCK_WALLET.balance[fromToken.currency as keyof typeof MOCK_WALLET.balance] || 0;
    

    if (sellAmount > walletBalance) {
      openNotification('error', 'Error', `Insufficient ${fromToken.currency} balance`);
      return;
    }

    // Check if user has enough ETH for network fee
    if (MOCK_WALLET.network === "ethereum" && fromToken.currency !== "ETH") {
      const ethBalance = MOCK_WALLET.balance.ETH;
      if (ethBalance < MOCK_WALLET.networkFee) {
        openNotification('error',"Error", "Insufficient ETH balance to pay for transaction fees on Ethereum network");
        return;
      }
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      openNotification('success', "Transaction successful!", "Transaction successful!");
      console.log("Swap successful:", {
        from: { currency: fromToken.currency, amount: data.sell },
        to: { currency: toToken.currency, amount: exchangeBalance },
        networkFee: MOCK_WALLET.networkFee,
      });
    }, 1000);
  };

  const getConversionRate = useCallback((from: Currency, to: Currency) => {
    if (!from || !to) return "0";
    const rate = from.price / to.price;
    return rate.toFixed(8);
  }, []);

  const getFeeAmount = useCallback((value: string, currency: Currency) => {
    if (!value || !currency) return "0";
    const fee = parseFloat(value) * currency.price * 0.0025; // 0.25% fee
    return fee.toFixed(2);
  }, []);

  const getPriceImpact = useCallback(
    (value: string, from: Currency, to: Currency) => {
      if (!value || !from || !to) return "0";
      // Simulate price impact calculation
      const impact = -0.24; // This would normally be calculated based on liquidity
      return impact.toFixed(2);
    },
    []
  );

  const [api, contextHolder] = notification.useNotification();

  const openNotification = (type: 'error' | 'success', message: string, description: string) => {
    api[type]({
      message,
      description,
      placement: 'bottom',
      pauseOnHover: true,
      duration: 5,
    });
  };

  return (
    <div className="container">
      {contextHolder}
      <div className="w-screen min-h-full max-w-[1200px] flex flex-col items-center flex-1 relative m-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2 relative max-w-[480px] mx-auto py-16 w-full min-h-[31rem]"
        >
          <div
            className={`input-container ${active === 1 ? "!bg-black" : ""}`}
            onClick={() => setActive(1)}
          >
            <div className="flex">
              <div className="text-xl px-6 text-[16px] !text-[#ffffffa6]">
                Sell
              </div>
            </div>
            <div
              className="flex items-center justify-center h-auto"
              onClick={() => setActive(2)}
            >
              <Controller
                control={control}
                name="sell"
                render={({ field: { value } }) => (
                  <Input
                    placeholder="0"
                    className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                    value={value}
                    onChange={(e) => handleSellChange(e.target.value)}
                  />
                )}
              />
              <div className="pr-[30px]">
                <Button
                  onClick={() => setOpen(true)}
                  className=""
                  icon={<DownOutlined />}
                  iconPosition="end"
                >
                  {fromToken?.currency}
                  {fromToken?.currency && (
                    <img
                      src={`/tokens/${fromToken?.currency}.svg`}
                      alt={fromToken?.currency}
                      className="w-[32px] h-[32px]"
                    />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-between px-6">
              <div className="text-xl text-[14px] !text-[#ffffffa6]">
                {/* {currentBalance} {fromToken?.currency} */}≈ $
                {(parseFloat(sellValue) * fromToken.price || 0).toFixed(2)}
              </div>
              {/* <Button onClick={setMaxValue} type="link" className="!p-0 !m-0 !text-[#ffffffa6]">Max</Button> */}
            </div>
          </div>
          <div
            className={`input-container ${active === 2 ? "!bg-black" : ""}`}
            onClick={() => setActive(2)}
          >
            <div className="flex">
              <div className="text-xl px-6 text-[16px] !text-[#ffffffa6]">
                Buy
              </div>
            </div>
            <div className="flex items-center justify-center h-auto">
              <Controller
                control={control}
                name="buy"
                render={({ field: { value } }) => (
                  <Input
                    placeholder="0"
                    className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                    value={value}
                    onChange={(e) => handleBuyChange(e.target.value)}
                  />
                )}
              />
              <div className="pr-[30px]">
                <Button
                  onClick={() => setOpen(true)}
                  icon={<DownOutlined />}
                  iconPosition="end"
                >
                  {toToken?.currency || ""}
                  {toToken?.currency && (
                    <img
                      src={`/tokens/${toToken?.currency}.svg`}
                      alt={toToken?.currency}
                      className="w-[32px] h-[32px]"
                    />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex">
              <div className="text-xl px-6 text-[14px] !text-[#ffffffa6]">
                ≈ $
                {(
                  parseFloat(reverseExchangeBalance as string) *
                    toToken.price || 0
                ).toFixed(2)}
              </div>
            </div>
          </div>
          <Button
            className="swap-btn"
            icon={<ArrowDownOutlined />}
            onClick={() => {
              if (fromToken && toToken) {
                handleChangeToken(
                  toToken,
                  fromToken,
                  (value) => {
                    setValue("fromToken", value);
                  },
                  toToken,
                  (value) => {
                    setValue("toToken", value);
                  }
                );
              }
            }}
          />
          <Button
            className="submit-btn"
            loading={isLoading}
            disabled={!watch("sell")}
            htmlType="submit"
            type="primary"
          >
            Swap
          </Button>

          {sellValue && fromToken && toToken && (
            <div className="mt-4 text-sm text-[#ffffffa6] absolute -bottom-[12rem] w-full h-[15rem]">
              <div className="flex justify-between mb-2">
                <span>
                  1 {fromToken.currency} ={" "}
                  {getConversionRate(fromToken, toToken)} {toToken.currency} ($
                  {fromToken.price.toFixed(2)})
                </span>
                <span
                  className="cursor-pointer hover:text-white"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Hide details" : "View details"}
                </span>
              </div>

              <div className="flex justify-between items-center mb-2"></div>

              {showDetails && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Fee (0.25%)</span>
                    <span>${getFeeAmount(sellValue, fromToken)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Network cost</span>
                    <span>N/A</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Order routing</span>
                    <span>Uniswap API</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Price impact</span>
                    <span>
                      {getPriceImpact(sellValue, fromToken, toToken)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Max slippage</span>
                    <span>Auto (0.50%)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      <ModalComponent
        open={open}
        setOpen={setOpen}
        tokenLists={tokenLists}
        onSelect={(token) => {
          if (active === 1 && fromToken) {
            handleChangeToken(
              token,
              fromToken,
              (value) => setValue("fromToken", value),
              toToken,
              (value) => setValue("toToken", value)
            );
          } else if (active === 2 && toToken) {
            handleChangeToken(
              token,
              toToken,
              (value) => setValue("toToken", value),
              fromToken,
              (value) => setValue("fromToken", value)
            );
          }
          setOpen(false);
        }}
      />
    </div>
  );
}

export default App;
