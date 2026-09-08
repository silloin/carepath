$content = Get-Content 'c:/Users/hp/Desktop/healthcare/client/src/App.jsx' -Raw
# Remove the incorrect addition from SimplePage
$content = $content -replace '<TreatmentSessionColumns treatments=\{treatments\.data\} hospitals=\{hospitals\.data\} />', ''
# Find the Home function and add the component before the closing </main>
$pattern = '(</main><Footer /></>)'
$replacement = "<TreatmentSessionColumns treatments={treatments.data} hospitals={hospitals.data} /></main><Footer /></>"
$content = $content -replace $pattern, $replacement
$content | Set-Content 'c:/Users/hp/Desktop/healthcare/client/src/App.jsx'
