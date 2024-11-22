import { CryptoData } from "@/lib/binance";
import { View, Text } from "react-native";

export const CryptoItem = ({ item }: { item: CryptoData }) => (
  <View className="p-4 bg-white rounded-lg shadow-lg mb-3">
    <Text className="text-xl font-bold text-center">{item?.symbol}</Text>
    <Text className="text-lg text-center mt-1">
      Current Price: <Text className="font-semibold">${item?.price}</Text>
    </Text>
    {item.change24h && (
      <Text
        className={`text-lg font-semibold text-center mt-2 ${
          item.change24h >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        24h Change: {item.change24h.toFixed(2)}%
      </Text>
    )}
  </View>
);
