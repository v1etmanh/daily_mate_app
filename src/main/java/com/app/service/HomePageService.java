package com.app.service;

import java.sql.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.app.model.Customer;
import com.app.model.UserProfile;
import com.app.repository.CustomerRepository;
import com.app.repository.UserProfileRepository;


@Service
public class HomePageService {
	@Autowired
	
private CustomerRepository cusRe;
	@Autowired
	private UserProfileRepository userRe;
	public Customer SavenewCus(@AuthenticationPrincipal Jwt jwt) {
		 String email=jwt.getClaimAsString("email");
	        String name =jwt.getClaimAsString("name");
	        String givenName=jwt.getClaimAsString("given_name");
	        String familyName=jwt.getClaimAsString("family_name");
	        Customer c=cusRe.findCustomerByEmail(email);
	        if(c==null) {
	        	c=new Customer();
	        c.setUsername(name);
	        c.setEmail(email);  
	        c.setRole("USER");
	        c.setCreateDate(new Date(System.currentTimeMillis()));
	        c.setFamilyName(familyName);
	        c.setGivenName(givenName);
	        UserProfile u=new UserProfile();
	        u.setName("family");
	        
	        u.setCusId(c);
	        
	      Customer c1=  cusRe.save(c);
	      this.userRe.save(u);
	        return c1;
	}
	        return c;
	}
}
