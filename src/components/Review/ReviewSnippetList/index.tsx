// External imports
import React from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

// Internal imports - Imported like this to avoid circular dependency
import { ProfileIcon } from '@/components/ProfileIcon';
import { ChevronForward } from '@/components/ChevronForward';

interface ReviewSnippet {
  url: string;
  authorName: string;
  review: string;
  summary: string;
  authorAvatarUrl?: string;
}

interface ReviewSnippetListProps {
  snippets: ReviewSnippet[];
}

export const ReviewSnippetList = ({ snippets }: ReviewSnippetListProps) => {
  const handleReviewPress = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View style={styles.reviewSummarySnippetContainer}>
      {snippets.map((snippet, index) => (
        <View key={index} style={styles.reviewSummarySnippetRow}>
          <View style={styles.reviewSummarySnippetAvatar}>
            <ProfileIcon
              size={32}
              imageUrl={snippet.authorAvatarUrl}
              letter={snippet.authorName.charAt(0).toUpperCase()}
            />
          </View>
          <TouchableOpacity style={styles.reviewSummarySnippetContent} onPress={() => handleReviewPress(snippet.url)}>
            <View style={styles.reviewSummarySnippetTextContainer}>
              <Text style={styles.reviewSummarySnippetText} numberOfLines={2} ellipsizeMode='tail'>
                {snippet.review}
              </Text>
              <Text style={styles.reviewSummarySnippetMeta} numberOfLines={1} ellipsizeMode="tail">
                {snippet.summary}
              </Text>
            </View>
            <ChevronForward />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewSummarySnippetContainer: {
    gap: 25,
    flexDirection: 'column',
  },
  reviewSummarySnippetTextContainer: {
    flex: 0.90,
    gap: 8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  reviewSummarySnippetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  reviewSummarySnippetAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSummarySnippetAvatarText: {
    fontWeight: 'bold',
    color: '#3b82f6',
    fontSize: 18,
  },
  reviewSummarySnippetAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#eee',
    justifyContent: 'center',
  },
  reviewSummarySnippetContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSummarySnippetText: {
    fontSize: 15,
    color: '#222',
  },
  reviewSummarySnippetMeta: {
    fontSize: 13,
    color: '#888',
  },
});
