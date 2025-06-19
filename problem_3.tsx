
// Issues Found:

// 1. prices is in dependency array of useMemo, but it is not used in the useMemo function
// - Causes unnecessary recomputations when prices change
// => solution: Remove prices from dependency array


// 2. Incorrect variable reference inside filter
// - lhsPriority is undefined

// if (lhsPriority > -99) {
//     if (balance.amount <= 0) {
//       return true;
//     }
//  }
// => solution: Use balancePriority instead of lhsPriority

// 3. Logic in filter is inverted

// if (lhsPriority > -99) {
//     if (balance.amount <= 0) {
//       return true;
//     }
//  }

// => solution: It should return true for positive balances, not negative ones


// 4. getPriority function uses any
// - blockchain: any should be properly typed
// => use union type for blockchain
// => Define a proper type/enum

// 5. Issue: Using index as key can lead to rendering bugs
// key={index}
// => solution: Use a unique identifier for each balance or combine index with unique identifier

// 6. formattedBalances is not used
// => solution: Remove formattedBalances and move formatting logic into the mapping that creates rows

// 7. Unecessary separation of data transformation and rendering logic for rows and sortedBalances
// => solution: Combine the data transformation and rendering logic


interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
  formatted: string;
}

interface BoxProps {}

interface Props extends BoxProps {
  // Add specific props if needed
}

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;

// Move outside component to prevent recreation
const BLOCKCHAIN_PRIORITIES: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
} as const;

const getPriority = (blockchain: Blockchain): number => {
  return BLOCKCHAIN_PRIORITIES[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = (props) => {
  const { ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // Memoize the priority calculation
  const balancesWithPriority = useMemo(() => {
    return balances.map((balance) => ({
      ...balance,
      priority: getPriority(balance.blockchain),
    }));
  }, [balances]);

  // Memoize filtered and sorted balances
  const sortedBalances = useMemo(() => {
    return balancesWithPriority
      .filter((balance) => {
        // Fix the logic: only include positive balances with valid priority
        return balance.priority > -99 && balance.amount > 0;
      })
      .sort((lhs, rhs) => {
        // Sort by priority (descending), then by amount (descending)
        if (lhs.priority !== rhs.priority) {
          return rhs.priority - lhs.priority;
        }
        return rhs.amount - lhs.amount;
      });
  }, [balancesWithPriority]);

  // Memoize rows to prevent unnecessary re-renders
  const rows = useMemo(() => {
    const formattedBalances = sortedBalances.map((balance) => ({
      ...balance,
      formatted: balance.amount.toFixed(2),
    }));

    return formattedBalances.map((balance, index) => {
      const usdValue = (prices[balance.currency] ?? 0) * balance.amount;
      return (
        <WalletRow
          className={classes.row}
          key={`${balance.currency}-${balance.blockchain}-${index}`} // Better key
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [sortedBalances, prices]);

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
