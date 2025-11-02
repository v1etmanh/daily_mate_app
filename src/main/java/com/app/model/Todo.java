package com.app.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@RequiredArgsConstructor

public class Todo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long todoId;

    private String description;             // Mô tả hoạt động, ví dụ: "Đi ăn tối", "Chạy bộ"
   
    private LocalDateTime timeStart;        // Thời gian bắt đầu thực hiện

    private double estimateTime;            // Ước tính thời gian hoạt động (đơn vị: giờ hoặc phút)

    private String location;

    // ✳️ MỚI THÊM — để đánh giá thông minh
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonBackReference
    private UserProfile userProfile;              // Ai thực hiện hoạt động (dùng để tra UserProfile)
    @Lob
    @Column(columnDefinition = "TEXT")
    private String evaluation;              // GPT đánh giá: "Hoạt động phù hợp với thời tiết hiện tại"
    @Lob
    @Column(columnDefinition = "TEXT")
  
    private String warning;                 // GPT cảnh báo: "Trời mưa, nên mang áo mưa"

private String priority;
private String healthImpact;
private String weatherSuitability;

private String preparationNeeded;
private String alternativeActivity;




}

