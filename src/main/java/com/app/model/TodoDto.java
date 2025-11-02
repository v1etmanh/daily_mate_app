package com.app.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class TodoDto {
	private String description;             // Mô tả hoạt động, ví dụ: "Đi ăn tối", "Chạy bộ"

    private LocalDateTime timeStart;        // Thời gian bắt đầu thực hiện

    private double estimateTime;            // Ước tính thời gian hoạt động (đơn vị: giờ hoặc phút)



                  // Ai thực hiện hoạt động (dùng để tra UserProfile)
   
    private String evaluation;              // GPT đánh giá: "Hoạt động phù hợp với thời tiết hiện tại"
  
  
    private String warning;                 // GPT cảnh báo: "Trời mưa, nên mang áo mưa"

private String priority;
private String healthImpact;
private String weatherSuitability;

private String preparationNeeded;
private String alternativeActivity;



}
