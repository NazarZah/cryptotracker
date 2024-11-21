import axios from "axios";

export interface CryptoData {
  symbol: string;
  price: string;
  change24h?: number; // 24-hour change in percentage
}

// API configuration
const API_CONFIG = {
  BINANCE_REST_API: "https://api.binance.com/api/v3",
  BINANCE_WEBSOCKET_API: "wss://stream.binance.com:9443/ws",
};

// Function to fetch 24-hour opening price for a symbol
export const getPrice24hAgo = async (
  symbol: string
): Promise<number | null> => {
  try {
    const { data } = await axios.get(
      `${API_CONFIG.BINANCE_REST_API}/ticker/24hr?symbol=${symbol}`
    );
    return parseFloat(data.openPrice); // Parse openPrice to a number
  } catch (error) {
    console.error(`Failed to fetch 24h opening price for ${symbol}:`, error);
    return null;
  }
};

// WebSocket handler for Binance price updates
export const connectToBinanceWebSocket = async (
  onPriceUpdate: (data: CryptoData) => void,
  symbols: string[]
): Promise<WebSocket | null> => {
  const priceStats: Record<string, number> = {};

  // Fetch the opening prices for all symbols asynchronously
  await Promise.all(
    symbols.map(async (symbol) => {
      const openPrice = await getPrice24hAgo(symbol);
      if (openPrice !== null) {
        priceStats[symbol] = openPrice;
      }
    })
  );

  // Create WebSocket connection
  const socket = new WebSocket(API_CONFIG.BINANCE_WEBSOCKET_API);

  // WebSocket event: On connection established
  socket.onopen = () => {
    console.log("WebSocket connected to Binance");

    const params = symbols.map((symbol) => `${symbol.toLowerCase()}@trade`);
    const subscribeMessage = {
      id: Date.now(),
      method: "SUBSCRIBE",
      params,
    };
    socket.send(JSON.stringify(subscribeMessage));
  };

  // WebSocket event: On receiving message
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Validate the received data structure
      if (data.e === "trade" && data.s && data.p) {
        const { s: symbol, p: price } = data;
        const openPrice = priceStats[symbol];

        // Calculate 24-hour change percentage
        const change24h =
          openPrice !== undefined
            ? ((parseFloat(price) - openPrice) / openPrice) * 100
            : undefined;

        onPriceUpdate({
          symbol,
          price,
          change24h,
        });
      } else {
        console.warn("Invalid trade event received:", data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  // WebSocket event: On error
  socket.onerror = (error) => {
    console.error("WebSocket encountered an error:", error);
  };

  // WebSocket event: On connection close
  socket.onclose = (event) => {
    console.warn("WebSocket connection closed. Reconnecting...", event);
    setTimeout(() => connectToBinanceWebSocket(onPriceUpdate, symbols), 5000); // Retry after 5 seconds
  };

  return socket;
};
