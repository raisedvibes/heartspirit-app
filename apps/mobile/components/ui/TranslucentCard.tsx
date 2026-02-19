import { View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";

type Props = ViewProps & {
  className?: string;
};

export default function TranslucentCard({
  children,
  className = "",
  ...props
}: Props) {
  return (
    <View className={`rounded-2xl overflow-hidden border border-white/20 ${className}`}>
      <BlurView intensity={40} tint="light" className="p-5 bg-white/10">
        {children}
      </BlurView>
    </View>
  );
}
