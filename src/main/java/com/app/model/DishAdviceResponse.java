package com.app.model;


import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class DishAdviceResponse {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long dishAdviceId;
    private String name;    // Tên món ăn, ví dụ: "Canh chua cá thu"
     // Lời khuyên cho từng người dùng phù hợp
    private String url;  
    private String reason; // Thêm dòng này
    private String cookingMethod;
    @ManyToOne
    @JsonBackReference
    @JoinColumn(name = "dish_create_id")
    private DishCreate dishCreate; // Đổi tên field
    @OneToMany(mappedBy = "dishReponse",cascade = CascadeType.ALL)
    @JsonManagedReference
    private  List<UserSuitability> userSuitability;
    private String familySuitabilityLevel; // HIGH / MEDIUM / LOW
    private String suggestionNote; // Gợi ý chỉnh món, thay thế
    private boolean isChossen;
    private String userNote;
    private int markFromUser;
}
