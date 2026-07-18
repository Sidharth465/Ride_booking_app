import { AppColors } from "@/utils/Constants";
import { rebuildHomeStyles } from "@/styles/homeStyles";
import { rebuildCommonStyles } from "@/styles/commonStyles";
import { rebuildAuthStyles } from "@/styles/authStyles";
import { rebuildRoleStyles } from "@/styles/roleStyles";
import { rebuildModalStyles } from "@/styles/modalStyles";
import { rebuildRiderStyles } from "@/styles/riderStyles";
import { rebuildRideStyles } from "@/styles/rideStyles";
import { rebuildUiStyles } from "@/styles/uiStyles";
import { rebuildMapStyles } from "@/styles/mapStyles";
import { rebuildLocationStyles } from "@/styles/locationStyles";

export function rebuildThemeStyles(c: AppColors) {
  rebuildHomeStyles(c);
  rebuildCommonStyles(c);
  rebuildAuthStyles(c);
  rebuildRoleStyles(c);
  rebuildModalStyles(c);
  rebuildRiderStyles(c);
  rebuildRideStyles(c);
  rebuildUiStyles(c);
  rebuildMapStyles(c);
  rebuildLocationStyles(c);
}
