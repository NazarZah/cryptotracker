import { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import throttle from "lodash.throttle";
import { connectToBinanceWebSocket, CryptoData, getPrice24hAgo } from "@/lib";
import { CustomCheckBox, CryptoItem } from "@/components";

const AVAILABLE_CRYPTO_OPTIONS = [
  "BTCUSDT",
  "ETHUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "SOLUSDT",
  "DOTUSDT",
  "DOGEUSDT",
  "LTCUSDT",
  "BNBUSDT",
];
const THROTTLE_INTERVAL = 3000;

const Home = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCryptos, setSelectedCryptos] = useState<string[]>([
    "BTCUSDT",
    "ETHUSDT",
    "XRPUSDT",
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "change24h">("price");
  const socketRef = useRef<WebSocket | null>(null);

  const initializeCryptoData = async (
    selectedCryptos: string[]
  ): Promise<CryptoData[]> => {
    return Promise.all(
      selectedCryptos.map(async (symbol) => {
        const openPrice = await getPrice24hAgo(symbol);
        return {
          symbol,
          price: "0",
          change24h: openPrice ? -100 : undefined, // Placeholder until WebSocket updates
        };
      })
    );
  };

  const connect = async () => {
    const initialData = await initializeCryptoData(selectedCryptos);
    setCryptoData(initialData);

    socketRef.current = await connectToBinanceWebSocket(
      throttle((data: CryptoData) => {
        if (data?.symbol && data?.price) {
          setCryptoData((prevData) =>
            prevData.map((item) =>
              item.symbol === data.symbol
                ? { ...item, price: data.price, change24h: data.change24h }
                : item
            )
          );
        }
      }, THROTTLE_INTERVAL),
      selectedCryptos
    );
  };

  const handleRefresh = async () => {
    socketRef.current?.close();
    setCryptoData([]);
    await connect();
  };

  const sortedCryptoData = [...cryptoData].sort((a, b) => {
    if (sortBy === "price") {
      return parseFloat(b.price) - parseFloat(a.price);
    } else {
      return (b.change24h || 0) - (a.change24h || 0);
    }
  });

  const toggleCryptoSelection = (symbol: string) => {
    setSelectedCryptos((prevSelected) =>
      prevSelected.includes(symbol)
        ? prevSelected.filter((item) => item !== symbol)
        : [...prevSelected, symbol]
    );
  };

  useEffect(() => {
    connect();
    return () => socketRef.current?.close();
  }, [selectedCryptos]);

  return (
    <SafeAreaView className="bg-[#f7f7f7] h-full">
      <StatusBar />
      {/* Header */}
      <View className="h-20 w-full flex flex-row items-center px-4 justify-between bg-slate-700 mb-5">
        <Text className="text-white text-2xl font-semibold">CRYTrack</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Text className="text-white text-lg font-bold">Filter</Text>
        </TouchableOpacity>
      </View>

      <View className="flex flex-row justify-center mb-5">
        <TouchableOpacity
          onPress={() => setSortBy("price")}
          className={`px-4 py-2 rounded-lg mx-2 ${
            sortBy === "price" ? "bg-slate-700" : "bg-gray-300"
          }`}
        >
          <Text
            className={`text-lg font-bold ${
              sortBy === "price" ? "text-white" : "text-black"
            }`}
          >
            Sort by Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSortBy("change24h")}
          className={`px-4 py-2 rounded-lg mx-2 ${
            sortBy === "change24h" ? "bg-slate-700" : "bg-gray-300"
          }`}
        >
          <Text
            className={`text-lg font-bold ${
              sortBy === "change24h" ? "text-white" : "text-black"
            }`}
          >
            Sort by Change
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleRefresh}
        className="bg-slate-700 rounded-lg py-5 mx-4 mb-5"
      >
        <Text className="text-white text-lg uppercase font-bold text-center">
          Refresh
        </Text>
      </TouchableOpacity>

      <FlatList
        data={sortedCryptoData}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => <CryptoItem item={item} />}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />

      <Modal
        visible={isModalVisible}
        presentationStyle="formSheet"
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView className="h-full bg-white p-5">
          <View className="flex flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold">Select Cryptocurrencies</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="bg-gray-300 px-4 py-2 rounded-lg"
            >
              <Text className="text-black text-sm font-bold">X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {AVAILABLE_CRYPTO_OPTIONS.map((symbol) => (
              <View
                key={symbol}
                className="flex-row items-center justify-between mb-4"
              >
                <Text className="text-xm ">{symbol}</Text>
                <CustomCheckBox
                  isChecked={selectedCryptos.includes(symbol)}
                  onToggle={() => toggleCryptoSelection(symbol)}
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setIsModalVisible(false)}
            className="bg-slate-700 rounded-lg py-5 mt-5"
          >
            <Text className="text-white text-lg font-bold text-center">
              Apply
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
