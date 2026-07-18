import React, { FC } from "react";
import { TouchableOpacity, Image, View, StyleSheet } from "react-native";
import CustomText from "../shared/CustomText";
import { PlaceSuggestion } from "@/types/ride";
import { locationStyles } from "@/styles/locationStyles";
import { uiStyles } from "@/styles/uiStyles";

type LocationItemProps = {
  item: PlaceSuggestion;
  onPress: (item: PlaceSuggestion) => void;
};

const LocationItem: FC<LocationItemProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={locationStyles.container}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <Image
          source={require("@/assets/icons/map_pin.png")}
          style={uiStyles.mapPinIcon}
        />
        <View style={styles.textWrap}>
          <CustomText fontFamily="Medium" numberOfLines={1}>
            {item.title}
          </CustomText>
          <CustomText
            style={uiStyles.suggestionText}
            fontSize={10}
            numberOfLines={2}
          >
            {item.description}
          </CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LocationItem;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textWrap: {
    flex: 1,
  },
});
