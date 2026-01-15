// External Dependencies
import React, { useState } from 'react';
import type { Review } from '@/libs/types';
import { Entypo } from '@expo/vector-icons';

import {
  View,
  Text,
  Linking,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'

// Internal Dependencies
import { RatingStars } from "@/components/Rating"; // Imported directly to avoid circular dependency
import { ProfileIcon } from "@/components/ProfileIcon"; // Imported directly to avoid circular dependency
import { formatCompactNumber, formatRelativeTimeDescriptive, reportError } from "@/libs/utils";

interface ReviewListProps {
  viewAllReviewsUri: string;
  reviews: Review[];
  totalCount: number;
  overallRating: number;
}

// Consts
const CARD_PADDING = 15;

export const ReviewList = ({ reviews, overallRating, totalCount, viewAllReviewsUri }: ReviewListProps) => {
  const reviewCount = formatCompactNumber(totalCount);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleExpanded = (reviewUri: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewUri)) {
      newExpanded.delete(reviewUri);
    } else {
      newExpanded.add(reviewUri);
    }
    setExpandedReviews(newExpanded);
  };

  const handleShowAllReviews = () => {
    if (!viewAllReviewsUri) {
      return;
    }

    Linking.openURL(viewAllReviewsUri).catch((error) => {
      reportError(error, {
        component: "ReviewList",
        action: "Open Reviews URI",
        extra: { viewAllReviewsUri },
      });
    });
  };

  const handleAuthorPress = (profileUri: string | null) => {
    if (!profileUri) {
      return;
    }

    Linking.openURL(profileUri);
  };


  return (
    <View>
      {/* Overall Rating Section */}
      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewTitle}>Google Reviews</Text>
        <View style={styles.reviewsMetadataContainer}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{overallRating?.toFixed(1)}</Text>
            <RatingStars size={11} color="#000" style={{ gap: 1 }} rating={overallRating} />
          </View>
          <Entypo name="dot-single" size={15} color="black" />
          <View style={styles.ratingsCountContainer}>
            <Text style={styles.ratingCountText}>{formatCompactNumber(totalCount)}</Text>
            <Text style={styles.ratingLabelText}>Reviews</Text>
          </View>
        </View>
      </View>

      {/* Horizontal Review List */}
      <ScrollView
        horizontal
        style={styles.reviewsScrollView}
        showsHorizontalScrollIndicator={false}
      >
        {reviews.map((review, index) => {
          const isExpanded = expandedReviews.has(review.uri);
          const publishedTime = new Date(review.publishedTime).getTime();

          return (
            <View
              key={review.uri}
              style={[styles.reviewCard, { paddingLeft: index === 0 ? 0 : CARD_PADDING }]}
            >

              {/* Profile Section */}
              <View style={styles.profileSection}>
                <ProfileIcon
                  size={40}
                  imageUrl={review.authorAttribution.photoUri || undefined}
                  onPress={() => handleAuthorPress(review.authorAttribution.profileUri)}
                  letter={review.authorAttribution.displayName?.charAt(0).toUpperCase() || 'A'}
                />

                <View style={styles.profileInfo}>
                  <Text style={styles.authorName}>
                    {review.authorAttribution.displayName || 'Anonymous'}
                  </Text>
                  <View style={styles.ratingDateSection}>
                    <RatingStars size={12} rating={review.rating} color="#000" />
                    {publishedTime && (
                      <>
                        <Entypo name="dot-single" size={13} color="#667" />
                        <Text style={styles.reviewDate}>{formatRelativeTimeDescriptive(publishedTime)}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Review Text */}
              <View style={styles.reviewTextContainer}>
                <Text
                  ellipsizeMode="tail"
                  style={styles.reviewText}
                  numberOfLines={isExpanded ? undefined : 4}
                >
                  {review.review}
                </Text>
                {review.review.length > 200 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => toggleExpanded(review.uri)}
                  >
                    <Text style={styles.showMoreText}>
                      {isExpanded ? 'Show less' : 'Show more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Show All Reviews Button */}
      {viewAllReviewsUri && (
        <TouchableOpacity style={styles.showAllButton} onPress={handleShowAllReviews}>
          <Text style={styles.showAllButtonText}>View all {reviewCount} reviews</Text>
        </TouchableOpacity>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  reviewsHeader: {
    marginBottom: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  reviewsMetadataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 19,
    color: "#000",
    fontWeight: "600",
  },
  ratingsCountContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  ratingCountText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
  },
  ratingLabelText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
  },
  reviewsScrollView: {
    marginBottom: 20,
  },
  reviewCard: {
    width: 350,
    borderRightWidth: 1,
    backgroundColor: '#fff',
    borderRightColor: '#E5E5E5',
    paddingHorizontal: CARD_PADDING
  },
  profileSection: {
    gap: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  ratingDateSection: {
    gap: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 14,
    color: '#667',
  },
  reviewTextContainer: {
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  showMoreButton: {
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: '#000',
    textDecorationLine: 'underline',
  },
  showAllButton: {
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
  },
  showAllButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
});
