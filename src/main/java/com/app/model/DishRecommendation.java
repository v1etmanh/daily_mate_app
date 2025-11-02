package com.app.model;

import java.sql.Date;
import java.util.List;


import org.springframework.web.bind.annotation.RequestMapping;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name="user_dish")
@AllArgsConstructor
@Data
@RequiredArgsConstructor
public class DishRecommendation {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "dish_recommen_id")
	private long dishRecommendId;
	private String dishName; // Tên món ăn cụ thể (VD: Phở bò, Gỏi cuốn tôm)
	@ManyToOne
	@JoinColumn(name = "user_id")
	@JsonBackReference
	private UserProfile  user;
    private String description; // Miêu tả ngắn gọn món ăn
   private List<String> mainIngredients;
    private int calories; // Ước tính calo/phần ăn
    private String url;
    
    private String mealType;
    // Đánh giá mức độ phù hợp
    private String healthSuitability;   // Liên quan dị ứng, bệnh nền, tuổi tác
    private String goalAlignment;       // Phù hợp mục tiêu giảm cân, tăng cân...
    private String tasteMatch;          // Phù hợp khẩu vị, tránh nguyên liệu không thích
    private Date createDate;
    private int overallScore;           // Tổng điểm phù hợp: 1-10
    private String recommendationNote; 
    private boolean isChossen;
    private String userNote;
    private int markFromUser;
}
