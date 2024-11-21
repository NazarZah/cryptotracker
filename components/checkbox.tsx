import { TouchableOpacity, View } from "react-native";

export const CustomCheckBox = ({
  isChecked,
  onToggle,
}: {
  isChecked: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity
    onPress={onToggle}
    className={`h-6 w-6 rounded-md border-2 flex items-center justify-center ${
      isChecked ? "bg-slate-700" : "border-gray-400"
    }`}
  >
    {isChecked && <View className="h-3 w-3 bg-white rounded-sm" />}
  </TouchableOpacity>
);
