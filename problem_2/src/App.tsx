import { ArrowDownOutlined, DownOutlined } from "@ant-design/icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, Input, notification } from "antd";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import * as yup from "yup";
import "./App.css";
import ModalComponent from "./components/Modal";
import { CURRENCY, MOCK_WALLET } from "./data";
import type { Currency } from "./types/SwapToken";

// Add these constants at the top with other constants
const MIN_AMOUNT = 0.0001;
const MAX_AMOUNT = 1000000;
const HIGH_PRICE_IMPACT_THRESHOLD = 5; // 5%

// Validation schema
const schema = yup.object().shape({
  sell: yup
    .string()
    .test(
      "min-amount",
      `Minimum amount is ${MIN_AMOUNT}`,
      (value: string | undefined) => {
        if (!value) return true;
        const num = parseFloat(value);
        return num === 0 || num >= MIN_AMOUNT;
      }
    )
    .test(
      "max-amount",
      `Maximum amount is ${MAX_AMOUNT}`,
      (value: string | undefined) => {
        if (!value) return true;
        const num = parseFloat(value);
        return num <= MAX_AMOUNT;
      }
    ),
  buy: yup
    .string()
    .test(
      "min-amount",
      `Minimum amount is ${MIN_AMOUNT}`,
      (value: string | undefined) => {
        if (!value) return true;
        const num = parseFloat(value);
        return num === 0 || num >= MIN_AMOUNT;
      }
    )
    .test(
      "max-amount",
      `Maximum amount is ${MAX_AMOUNT}`,
      (value: string | undefined) => {
        if (!value) return true;
        const num = parseFloat(value);
        return num <= MAX_AMOUNT;
      }
    ),
  fromToken: yup.object().required("From token is required"),
  toToken: yup.object().required("To token is required"),
}) as yup.ObjectSchema<Inputs>;

type Inputs = {
  sell: string;
  buy: string;
  fromToken: Currency;
  toToken: Currency;
};

function App() {
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      sell: "",
      buy: "",
      fromToken: CURRENCY[4],
      toToken: CURRENCY[1],
    },
    resolver: yupResolver(schema),
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
      openNotification(
        "error",
        "Invalid Input",
        "Please enter an amount to swap"
      );
      return;
    }

    const sellAmount = parseFloat(data.sell);
    const walletBalance =
      MOCK_WALLET.balance[
        fromToken.currency as keyof typeof MOCK_WALLET.balance
      ] || 0;

    // Check if user has enough balance
    if (sellAmount > walletBalance) {
      openNotification(
        "error",
        "Insufficient Balance",
        `You don't have enough ${fromToken.currency} in your wallet. Your balance: ${walletBalance} ${fromToken.currency}`
      );
      return;
    }

    // Check if user has enough ETH for network fee
    if (MOCK_WALLET.network === "ethereum" && fromToken.currency !== "ETH") {
      const ethBalance = MOCK_WALLET.balance.ETH;
      if (ethBalance < MOCK_WALLET.networkFee) {
        openNotification(
          "error",
          "Insufficient ETH for Network Fee",
          `You need at least ${MOCK_WALLET.networkFee} ETH to pay for the transaction fee on Ethereum network. Your ETH balance: ${ethBalance} ETH`
        );
        return;
      }
    }

    // Check price impact
    const priceImpact = parseFloat(
      getPriceImpact(data.sell, fromToken, toToken)
    );
    if (priceImpact < -HIGH_PRICE_IMPACT_THRESHOLD) {
      openNotification(
        "warning",
        "High Price Impact",
        `This swap will have a high price impact of ${Math.abs(
          priceImpact
        )}%. Consider splitting your trade into smaller amounts.`
      );
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      openNotification(
        "success",
        "Transaction Successful!",
        `Successfully swapped ${data.sell} ${fromToken.currency} to ${exchangeBalance} ${toToken.currency}`
      );
      console.log("Swap successful:", {
        from: { currency: fromToken.currency, amount: data.sell },
        to: { currency: toToken.currency, amount: exchangeBalance },
        networkFee: `${MOCK_WALLET.networkFee} ETH`,
        priceImpact: `${priceImpact}%`,
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

  const openNotification = (
    type: "error" | "success" | "warning",
    message: string,
    description: ReactNode
  ) => {
    api[type]({
      message,
      description,
      placement: "bottom",
      pauseOnHover: true,
      duration: 5,
    });
  };
  useEffect(() => {
    const errorMessages = [];

    if (errors.sell?.message) {
      errorMessages.push(`Sell: ${errors.sell.message}`);
    }
    if (errors.buy?.message) {
      errorMessages.push(`Buy: ${errors.buy.message}`);
    }

    if (errorMessages.length > 0) {
      openNotification(
        "error",
        "Validation Errors",
        <div>
          {errorMessages.map((msg, idx) => (
            <p key={idx}>{msg}</p> // or <li> if you use <ul>
          ))}
        </div>
      );
    }
  }, [errors]);

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
            style={{
              border: errors.sell ? "1px solid red" : "1px solid transparent",
            }}
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
                  <div className="flex flex-col w-full">
                    <Input
                      placeholder="0"
                      className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                      value={value}
                      onChange={(e) => handleSellChange(e.target.value)}
                    />
                  </div>
                )}
              />
              <div className="pr-[30px]">
                <Controller
                  control={control}
                  name="fromToken"
                  render={({ field: { value } }) => (
                    <Button
                      onClick={() => setOpen(true)}
                      className=""
                      icon={<DownOutlined />}
                      iconPosition="end"
                    >
                      {value?.currency}
                      {value?.currency && (
                        <img
                          src={`/tokens/${value?.currency}.svg`}
                          alt={value?.currency}
                          className="w-[32px] h-[32px]"
                        />
                      )}
                    </Button>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-between px-6">
              <div className="text-xl text-[14px] !text-[#ffffffa6]">
                {(parseFloat(sellValue) * fromToken.price || 0).toFixed(2)}
              </div>
            </div>
          </div>
          <div
            className={`input-container ${active === 2 ? "!bg-black" : ""}`}
            onClick={() => setActive(2)}
            style={{
              border: errors.buy ? "1px solid red" : "1px solid transparent",
            }}
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
                  <div className="flex flex-col w-full">
                    <Input
                      placeholder="0"
                      className="!text-white !border-transparent !bg-transparent !text-[30px] !px-6"
                      value={value}
                      onChange={(e) => handleBuyChange(e.target.value)}
                    />
                  </div>
                )}
              />
              <div className="pr-[30px]">
                <Controller
                  control={control}
                  name="toToken"
                  render={({ field: { value } }) => (
                    <Button
                      onClick={() => setOpen(true)}
                      icon={<DownOutlined />}
                      iconPosition="end"
                    >
                      {value?.currency || ""}
                      {value?.currency && (
                        <img
                          src={`/tokens/${value?.currency}.svg`}
                          alt={value?.currency}
                          className="w-[32px] h-[32px]"
                        />
                      )}
                    </Button>
                  )}
                />
              </div>
            </div>
            <div className="flex">
              <div className="text-xl px-6 text-[14px] !text-[#ffffffa6]">
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
