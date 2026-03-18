package com.disaster.dmas.service;

import com.disaster.dmas.dto.AuthResponse;
import com.disaster.dmas.dto.LoginRequest;
import com.disaster.dmas.dto.RegisterRequest;
import com.disaster.dmas.entity.Role;
import com.disaster.dmas.entity.User;
import com.disaster.dmas.enums.RoleType;
import com.disaster.dmas.repository.RoleRepository;
import com.disaster.dmas.repository.UserRepository;
import com.disaster.dmas.security.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(loginRequest.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        String role = user.getRoles().iterator().next().getName().name();
        String token = jwtTokenUtil.generateToken(userDetails.getUsername(), role);

        return AuthResponse.builder()
            .token(token)
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .phone(user.getPhone())
            .location(user.getLocation())
            .role(role)
            .build();
    }

    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }

        if (userRepository.existsByPhone(registerRequest.getPhone())) {
            throw new RuntimeException("Phone number is already taken");
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setName(registerRequest.getName());
        user.setPhone(registerRequest.getPhone());
        user.setLocation(registerRequest.getLocation());

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(registerRequest.getRole())
            .orElseThrow(() -> new RuntimeException("Role not found"));
        roles.add(userRole);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        String token = jwtTokenUtil.generateToken(savedUser.getEmail(), registerRequest.getRole().name());

        return AuthResponse.builder()
            .token(token)
            .id(savedUser.getId())
            .email(savedUser.getEmail())
            .name(savedUser.getName())
            .phone(savedUser.getPhone())
            .location(savedUser.getLocation())
            .role(registerRequest.getRole().name())
            .build();
    }

    public void initializeRoles() {
        if (!roleRepository.existsByName(RoleType.ADMIN)) {
            Role adminRole = new Role();
            adminRole.setName(RoleType.ADMIN);
            adminRole.setDescription("System Administrator");
            roleRepository.save(adminRole);
        }

        if (!roleRepository.existsByName(RoleType.RESPONDER)) {
            Role responderRole = new Role();
            responderRole.setName(RoleType.RESPONDER);
            responderRole.setDescription("Emergency Responder");
            roleRepository.save(responderRole);
        }

        if (!roleRepository.existsByName(RoleType.CITIZEN)) {
            Role citizenRole = new Role();
            citizenRole.setName(RoleType.CITIZEN);
            citizenRole.setDescription("Regular Citizen");
            roleRepository.save(citizenRole);
        }
    }
}
