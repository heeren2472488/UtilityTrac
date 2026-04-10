package com.utilitrack.project._6brtf.US022_tariff_mapping.controller;

import com.utilitrack.project._6brtf.US021_managetarrif.model.Tariff;
import com.utilitrack.project._6brtf.US021_managetarrif.repository.TariffRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tariff")
public class TariffController {

    private final TariffRepository tariffRepository;

    public TariffController(TariffRepository tariffRepository) {
        this.tariffRepository = tariffRepository;
    }

    @PostMapping("/add")
    public Tariff addTariff(@RequestBody Tariff tariff) {
        return tariffRepository.save(tariff);
    }

    @GetMapping
    public java.util.List<Tariff> getAll() {
        return tariffRepository.findAll();
    }
}