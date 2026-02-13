import React, { useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { buildNftImageCandidates, isLikelySvgUrl } from '../utils/nftMedia';

type NFTMediaProps = {
  uri: string;
  imageStyle: StyleProp<ImageStyle>;
  fallbackStyle: StyleProp<ViewStyle>;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
};

export default function NFTMedia({
  uri,
  imageStyle,
  fallbackStyle,
  fallbackIconSize = 28,
  fallbackIconColor = '#666',
}: NFTMediaProps) {
  const candidates = useMemo(() => buildNftImageCandidates(uri), [uri]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const current = candidates[candidateIndex] || '';
  const hasCurrent = !!current;

  const moveToNext = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setCandidateIndex(candidates.length);
    }
  };

  if (!hasCurrent) {
    return (
      <View style={fallbackStyle}>
        <Icon name="image-outline" size={fallbackIconSize} color={fallbackIconColor} />
      </View>
    );
  }

  if (isLikelySvgUrl(current)) {
    return (
      <View style={imageStyle}>
        <SvgUri width="100%" height="100%" uri={current} onError={moveToNext} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: current }}
      style={imageStyle}
      resizeMode="cover"
      onError={moveToNext}
    />
  );
}

