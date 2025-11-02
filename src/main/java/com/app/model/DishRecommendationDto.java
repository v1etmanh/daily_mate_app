package com.app.model;
import java.util.*;


public record DishRecommendationDto(
    String dishName, 
    String description, 
    List<String> mainIngredients, // Danh sách nguyên liệu chính
    int calories, // Ước tính calo/phần ăn

    // Đánh giá mức độ phù hợp
    String healthSuitability,   // Liên quan dị ứng, bệnh nền, tuổi tác
    String goalAlignment,       // Phù hợp mục tiêu giảm cân, tăng cân...
    String tasteMatch,          // Phù hợp khẩu vị, tránh nguyên liệu không thích
    int overallScore,           // Tổng điểm phù hợp: 1-10
    String recommendationNote   // Giải thích vì sao nên chọn món này
) {}

