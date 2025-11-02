package com.app.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class TodoCreateRequest {
	private long id;
	private String description;             // Mô tả hoạt động, ví dụ: "Đi ăn tối", "Chạy bộ"

    private LocalDateTime timeStart;        // Thời gian bắt đầu thực hiện

    private double estimateTime;            // Ước tính thời gian hoạt động (đơn vị: giờ hoặc phút)

  private String location;        // Địa điểm thực hiện hoạt động
    private long userId;
    
}
