package com.app.model;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@Data
@AllArgsConstructor
@RequiredArgsConstructor
@Entity

public class UserSuitability {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private long userSuitableId;
	  private String userName;
	    private String suitability; // VD: "Hợp", "Không hợp", "Cần cân nhắc"
	    private int score;          // 1-10
	    private String shortNote; 
    @ManyToOne
    @JoinColumn(name = "dish_advice_id")
    @JsonBackReference
    private DishAdviceResponse dishReponse;
    
}
