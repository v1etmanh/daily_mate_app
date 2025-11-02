package com.app.model;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "UserProfile")
@Data
@AllArgsConstructor
@RequiredArgsConstructor

public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private long userId;

    // === INPUT ===
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "age")
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "height_cm")
    private Float heightCm;

    @Column(name = "weight_kg")
    private Float weightKg;

    @Column(name = "dietary_goal", length = 100)
    private String dietaryGoal;

    @Column(name = "health_condition", length = 255)
    private String healthCondition;

    @Column(name = "taste_preference", length = 100)
    private String tastePreference;

    // === OUTPUT từ AI ===
    @Column(name = "health_description", length = 1000)
    private String healthDescription;

    @Column(name = "recommended_activities", length = 1000)
    private String recommendedActivities;

    @Column(name = "warnings", length = 1000)
    private String warnings;

    @Column(name = "diet_advice", length = 1000)
    private String dietAdvice;

    @Column(name = "target_weight")
    private Float targetWeight;

    @Column(name = "bmi")
    private Float bmi;

    @Column(name = "bmr")
    private Float bmr;

    @Column(name = "tdee")
    private Float tdee;

    @Column(name = "bmi_category", length = 50)
    private String bmiCategory;

    @Column(name = "body_type", length = 50)
    private String bodyType; // PEAR, APPLE, HOURGLASS, v.v.
    @OneToMany(mappedBy = "userProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Todo> todos = new ArrayList<>();
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DishRecommendation>dishs;
    @OneToMany(mappedBy = "user",cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<HealthAssessmentResponse> heals;
    // === Tính toán tự động BMI ===
   @ManyToOne
   @JoinColumn(name = "customer_id")
   @JsonBackReference
   private Customer cusId;
   
   private String allergies;
   private String dislikedIngredients;
    @PostLoad
    @PostPersist
    @PostUpdate
    public void calculateHealthStats() {
        if (heightCm != null && weightKg != null && heightCm > 0 && age != null && gender != null) {
            float heightM = heightCm / 100.0f;
            this.bmi = weightKg / (heightM * heightM);

            // BMI category
            if (bmi < 18.5f) bmiCategory = "Gầy";
            else if (bmi < 23f) bmiCategory = "Bình thường";
            else if (bmi < 25f) bmiCategory = "Thừa cân";
            else bmiCategory = "Béo phì";

            // BMR (Mifflin-St Jeor)
            if (gender == Gender.MALE)
                this.bmr = 10 * weightKg + 6.25f * heightCm - 5 * age + 5;
            else
                this.bmr = 10 * weightKg + 6.25f * heightCm - 5 * age - 161;

            // TDEE: nếu bạn chưa có activity level, gán mặc định là 1.4
            this.tdee = bmr * 1.4f;
        }
    }
    

}
